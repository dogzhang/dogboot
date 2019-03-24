import fs = require('fs');
import path = require('path');
let Router = require('koa-router');
let koaBody = require('koa-body');
let koaStatic = require('koa-static');
let Koa = require('koa');
import 'reflect-metadata'
import { Server } from 'net';

class Utils {
    static markAsComponent(target: Function) {
        target.prototype.$isComponent = true
        let paramTypes: Array<Function> = Reflect.getMetadata('design:paramtypes', target) || []
        if (paramTypes.includes(target)) {
            console.error(`${target.name}中存在自我依赖`)
            process.abort()
        }
        target.prototype.$paramTypes = paramTypes
    }

    static getFileListInFolder(dirPath: string) {
        let list = fs.readdirSync(dirPath)
        let fileList = []
        list.forEach(a => {
            let filePath = path.join(dirPath, a)
            let fileState = fs.statSync(filePath)
            if (fileState.isDirectory()) {
                fileList = fileList.concat(Utils.getFileListInFolder(filePath))
            } else {
                if (!filePath.endsWith('.d.ts')) {
                    fileList.push(filePath)
                }
            }
        })
        return fileList
    }

    static getValidator(obj: any) {
        return obj != null && obj.__proto__ && obj.__proto__.$validator
    }

    static async validateField(obj: any) {
        let validator = this.getValidator(obj)
        if (!validator) {
            return
        }
        let entries = Object.entries(validator)
        for (let entrie of entries) {
            let k = entrie[0]
            let fieldVal = obj[k]
            if (fieldVal instanceof Array) {
                for (let a of fieldVal) {
                    await this.validateField(a)
                }
            } else {
                await this.validateField(fieldVal)
            }
            let v = entrie[1]
            let funcList = v as Function[]
            for (let func of funcList) {
                await func(fieldVal)
            }
        }
    }
}

@Component
export class DogBootApplication {
    app = new Koa()
    server: Server
    ready: boolean = false
    private port: number = 3000
    private globalExceptionFilter: Function
    private render: Function
    private globalActionFilters: Function[] = []
    private prefix: string
    private execRootPath: string
    private container: DIContainer
    private controllerClasses: Function[] = []

    /**
     * app根目录，dogbooot会自动扫描子目录下的dist/controller/以及dist/startup/
     * @param appRootPath 
     */
    constructor(private readonly appRootPath: string) {
        this.container = new DIContainer(appRootPath)
        let execFileName = process.argv[1]
        if (execFileName.endsWith('.ts')) {
            this.execRootPath = path.join(appRootPath, 'src')
        } else {
            this.execRootPath = path.join(appRootPath, 'dist')
        }
        this.container.setComponentInstance(DogBootApplication, this)
    }
    private build() {
        let publicRootPath = path.join(this.appRootPath, 'public')
        this.app.use(koaStatic(publicRootPath))
        this.app.use(koaBody())
        let controllerRootPath = path.join(this.execRootPath, 'controller')
        Utils.getFileListInFolder(controllerRootPath).forEach(a => { this.checkAndHandleControllerFile(a) })
    }
    private checkAndHandleControllerFile(filePath: string) {
        let _Module = require(filePath)
        Object.values(_Module).filter(a => a instanceof Function).forEach((a: Function) => { this.checkAndHandleControllerClass(a) })
    }
    private checkAndHandleControllerClass(_Class: Function) {
        let _prototype = _Class.prototype
        let controllerName = _Class.name.replace(/controller$/i, '').toLowerCase()
        let controllerPath = _prototype.$path
        if (!controllerPath) {
            return
        }
        let router = new Router({
            prefix: controllerPath
        })
        Object.getOwnPropertyNames(_prototype).forEach(a => {
            this.checkAndHandleActionName(a, _Class, controllerName, router)
        })
        if (this.prefix) {
            router.prefix(this.prefix)
        }
        this.app.use(router.routes())

        this.controllerClasses.push(_Class)
    }
    private checkAndHandleActionName(actionName: string, _Class: Function, controllerName: string, router: any) {
        let _prototype = _Class.prototype
        let action = _prototype[actionName]
        if (!action.$method) {
            return
        }
        router[action.$method](action.$path, async (ctx: any) => {
            if (!this.ready) {
                return
            }
            try {
                await this.handleContext(actionName, _Class, controllerName, ctx)
            } catch (err) {
                let exceptionFilter = _prototype[actionName].$exceptionFilter || _prototype.$exceptionFilter || this.globalExceptionFilter
                if (!exceptionFilter) {
                    throw err
                }
                let exceptionFilterInstance = await this.container.getComponentInstanceFromFactory(exceptionFilter) as any
                if (!exceptionFilter.prototype.$exceptionHandlerMap) {
                    throw err
                }
                let handlerName = exceptionFilter.prototype.$exceptionHandlerMap.get(err.__proto__.constructor)
                if (!handlerName) {
                    handlerName = exceptionFilter.prototype.$exceptionHandlerMap.get(Error)
                }
                if (!handlerName) {
                    throw err
                }
                await exceptionFilterInstance[handlerName](err, ctx)
            }
        })
    }
    private async handleContext(actionName: string, _Class: Function, controllerName: string, ctx: any) {
        let _prototype = _Class.prototype
        let instance = await this.container.getComponentInstanceFromFactory(_prototype.constructor)
        let $params = instance[actionName].$params || []//使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
        let $paramTypes: Function[] = instance[actionName].$paramTypes || []//全部的参数类型
        let params = $params.map((b: Function, idx: number) => {
            let oldValArr = b(ctx)
            let oldVal = oldValArr[0]
            let typeSpecified = oldValArr[1]
            let toType = $paramTypes[idx]
            if (typeSpecified && toType) {
                return DogUtils.getTypeSpecifiedValue(toType, oldVal)
            } else {
                return oldVal
            }
        })
        for (let b of params) {
            await Utils.validateField(b)
        }
        let actionContext = new ActionFilterContext(ctx, params, $paramTypes, _Class, actionName)

        let actionFiltersOnController = _prototype.$actionFilters || []
        let actionFiltersOnAction = instance[actionName].$actionFilters || []
        let actionFilters = this.globalActionFilters.concat(actionFiltersOnController, actionFiltersOnAction)
        let actionFilterAndInstances: [Function, any][] = []
        for (let actionFilter of actionFilters) {
            let handlerName = actionFilter.prototype.$actionHandlerMap.get(DoBefore)
            if (!handlerName) {
                continue
            }
            let filterInstance = await this.container.getComponentInstanceFromFactory(actionFilter) as any
            actionFilterAndInstances.push([actionFilter, filterInstance])
            await filterInstance[handlerName](actionContext)
            if (ctx.status != 404) {
                break
            }
        }

        if (ctx.status == 404) {
            let body = await instance[actionName](...params)

            if (ctx.status == 404) {
                if (body instanceof ViewResult) {
                    if (this.render) {
                        ctx.body = await this.render(controllerName, actionName, body.data)
                    } else {
                        throw new Error('没有找到任何视图渲染器')
                    }
                } else {
                    ctx.body = body
                }
            }
        }

        for (let [actionFilter, filterInstance] of actionFilterAndInstances.reverse()) {
            let handlerName = actionFilter.prototype.$actionHandlerMap.get(DoAfter)
            if (!handlerName) {
                continue
            }
            await filterInstance[handlerName](actionContext)
        }
    }
    private async startUp() {
        let startUpRootPath = path.join(this.execRootPath, 'startup')
        if (!fs.existsSync(startUpRootPath)) {
            return
        }
        let startUpFileList = Utils.getFileListInFolder(startUpRootPath)
        let startUpClassList = []
        for (let filePath of startUpFileList) {
            let _Module = require(filePath)
            Object.values(_Module).forEach(a => {
                if (a instanceof Function) {
                    startUpClassList.push(a)
                }
            })
        }
        startUpClassList.sort((a, b) => b.prototype.$order - a.prototype.$order)
        for (let startUp of startUpClassList) {
            await this.container.getComponentInstanceFromFactory(startUp as Function)
        }
    }
    private async initComponents() {
        for (let componentClass of this.controllerClasses) {
            await this.container.getComponentInstanceFromFactory(componentClass as Function)
        }
    }

    /**
     * 设置整个app的路由前缀
     * @param prefix 前缀，比如：/api
     */
    setPrefix(prefix: string) {
        this.prefix = prefix
        return this
    }

    /**
     * 设置app的端口
     * @param port 端口，默认为3000
     */
    setPort(port: number) {
        this.port = port
        return this
    }

    /**
     * 设置html渲染器
     * @param render 一个渲染器函数，此函数接收以下参数
     * @param controllerName 控制器名称，已去除Controller后缀，且转换为小写，比如：HomeController -> home
     * @param actionName Action名称，取方法名称，而不是映射的路由地址，比如：GetMapping('/getname') getName(){} -> getName
     * @param data 渲染页面的数据
     * 渲染器需要返回一个字符串，这个字符串就是最终渲染出来的html
     */
    setRender(render: (controllerName: string, actionName: string, data: any) => string) {
        this.render = render
        return this
    }

    /**
     * 设置全局异常过滤器
     * @param exceptionFilter 
     */
    useExceptionFilter(exceptionFilter: Function) {
        this.globalExceptionFilter = exceptionFilter
        return this
    }

    /**
     * 设置全局Action过滤器
     * @param actionFilter 
     */
    useActionFilter(actionFilter: Function) {
        this.globalActionFilters.push(actionFilter)
        return this
    }

    /**
     * 启动程序，此方法中，所有组件包括StartUp都会初始化，然后才开始接受http请求
     */
    run() {
        let startTime = Date.now()
        this.build()
        this.server = this.app.listen(this.port)
        this.startUp().then(async () => {
            await this.initComponents()
            this.ready = true
            let endTime = Date.now()
            console.log(`Your application has started at ${this.port} in ${endTime - startTime}ms`)
        })
        return this
    }

    /**
     * 设置组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * @param key 组件key，可以是任意值
     * @param instance 组件实例，可以是任意值
     */
    setComponentInstance(key: any, instance: any) {
        this.container.setComponentInstance(key, instance)
    }

    /**
     * 根据key获取组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * DogBootApplication也是一个组件，并且加入到容器，所以你可以在你的组件中使用，比如：private readonly app: DogBootApplication
     * @param key 
     */
    getComponentInstance<T>(key: any): T {
        return this.container.getComponentInstance(key)
    }
}

class DIContainer {
    private componentInstanceMap: Map<any, any> = new Map()
    constructor(private readonly appRootPath: string) {
    }

    setComponentInstance(key: any, instance: any) {
        this.componentInstanceMap.set(key, instance)
    }

    getComponentInstance<T>(key: any): T {
        return this.componentInstanceMap.get(key)
    }

    async getComponentInstanceFromFactory(target: Function): Promise<any> {
        if (!target.prototype.$isComponent) {
            throw new Error(`${target.name}没有被注册为可自动解析的组件，请至少添加@Component、@StartUp、@Controller、@Config等装饰器中的一种`)
        }
        let instance = this.componentInstanceMap.get(target)
        if (instance) {
            return instance
        }

        return await this.createComponentInstance(target)
    }

    async createComponentInstance(target: Function): Promise<any> {
        let instance = null
        if (target.prototype.$isConfig) {
            instance = this.getConfigValue(target)
            this.componentInstanceMap.set(target, instance)
        } else {
            instance = Reflect.construct(target, await this.getParamInstances(target))
            this.componentInstanceMap.set(target, instance)
            await this.resolveAutowiredDependences(instance)
            let initMethod = target.prototype.$initMethod
            if (initMethod) {
                await instance[initMethod]()
            }
        }
        return instance
    }

    async getParamInstances(target: Function): Promise<any[]> {
        let paramTypes = target.prototype.$paramTypes
        let paramInstances = []
        for (let paramType of paramTypes) {
            let paramInstance = await this.getComponentInstanceFromFactory(paramType as any)
            paramInstances.push(paramInstance)
        }
        return paramInstances
    }

    async resolveAutowiredDependences(instance) {
        let target = instance.__proto__.constructor
        let autowiredMap = target.prototype.$autowiredMap
        if (autowiredMap) {
            for (let [k, v] of autowiredMap) {
                if (v.name) {
                    instance[k] = await this.getComponentInstanceFromFactory(v as any)
                } else {
                    let _Class = v()
                    instance[k] = await this.getComponentInstanceFromFactory(_Class as any)
                }
            }
        }
    }

    getConfigValue(target: Function) {
        let oldVal = require(path.join(this.appRootPath, 'config.json'))
        let sectionArr = target.prototype.$configField.split('.').filter((a: any) => a)
        for (let a of sectionArr) {
            if (oldVal == null) {
                return null
            }
            oldVal = oldVal[a]
        }
        if (oldVal == null) {
            return null
        }
        return DogUtils.getTypeSpecifiedValue(target, oldVal)
    }
}

/**
 * 包含一些公开的实用工具方法
 */
export class DogUtils {
    static getTypeSpecifiedValue<T>(type: Function, oldVal: any): T {
        if (oldVal == null) {
            return null
        }
        if (type == Number || type == String || type == Boolean) {
            return type(oldVal)
        }
        if (type == Date) {
            return new Date(oldVal) as any
        }
        let newVal = Reflect.construct(type, [])
        type.prototype.$fields && Object.entries(type.prototype.$fields).forEach(([k, v]) => {
            let typeSpecifiedMap: TypeSpecifiedMap = v as TypeSpecifiedMap
            if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.General) {
                newVal[k] = this.getTypeSpecifiedValue(typeSpecifiedMap.type, oldVal[typeSpecifiedMap.sourceName])
            } else if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.Array) {
                newVal[k] = oldVal[typeSpecifiedMap.sourceName].map(a => this.getTypeSpecifiedValue(typeSpecifiedMap.type, a))
            }
        })
        return newVal
    }

    static getTypeSpecifiedValueArray<T>(type: Function, oldVal: any[]): T[] {
        if (oldVal == null) {
            return null
        }
        return oldVal.map(a => this.getTypeSpecifiedValue(type, a))
    }
}

/**
 * 指定此类为组件，生命周期将完全交给dogboot管理
 * 所有组件将在程序启动的时候初始化完成，所有组件初始化完成后，程序才会开始接受http请求
 * @param target 
 */
export function Component(target: Function) {
    Utils.markAsComponent(target)
}

/**
 * 指定此类为预启动组件，将在程序启动时预先启动。
 * 事实上，所有的组件只要被使用到都会在程序启动时预先启动，使用StartUp标记那些没有被其他组件使用的组件，确保此组件也能启动
 * StartUp是一种特殊的Component
 * @param order 启动顺序，值越大越优先启动
 */
export function StartUp(order: number = 0) {
    return function (target: Function) {
        target.prototype.$order = order
        Utils.markAsComponent(target)
    }
}

/**
 * 指定此类为控制器
 * Controller是一种特殊的Component
 * @param path 映射到的路由，默认取类名前一部分，比如HomeController默认映射到/Home，Home也映射到/Home
 */
export function Controller(path: string = null) {
    return function (target: Function) {
        target.prototype.$path = path || '/' + target.name.replace(/controller$/i, '')
        Utils.markAsComponent(target)
    }
}

/**
 * 表示一个配置文件映射器
 * Config是一种特殊的Component
 * @param field 需要映射的节
 */
export function Config(field: string = null) {
    return function (target: Function) {
        target.prototype.$isConfig = true
        target.prototype.$configField = field
        Utils.markAsComponent(target)
    }
}

/**
 * 通过属性注入依赖的组件
 * @param type 
 */
export function Autowired(type: Function) {
    return function (target: any, name: string) {
        if (!type) {
            console.error(`${target.constructor.name}中存在不正确的循环依赖${name}，请使用@Autowired(() => type of ${name})注入此依赖项`)
            process.abort()
        }
        target.$autowiredMap = target.$autowiredMap || new Map()
        target.$autowiredMap.set(name, type)
    }
}

/**
 * 映射此方法为Action
 * @param type method类型，默认为get
 * @param path 映射到的路由，默认为action名称
 */
export function Mapping(type: string = 'get', path: string = null) {
    return function (target: any, name: string) {
        let action = target[name]
        action.$method = type.toLowerCase()
        action.$path = path || '/' + action.name
        action.$paramTypes = Reflect.getMetadata('design:paramtypes', target, name)
    }
}

/**
 * 映射此方法为Action，允许所有类型的method请求
 * @param path 映射到的路由，默认为action名称
 */
export function AllMapping(path: string = null) {
    return Mapping('all', path)
}

/**
 * 映射此方法为Action，只允许get请求
 * @param path 映射到的路由，默认为action名称
 */
export function GetMapping(path: string = null) {
    return Mapping('get', path)
}

/**
 * 映射此方法为Action，只允许post请求
 * @param path 映射到的路由，默认为action名称
 */
export function PostMapping(path: string = null) {
    return Mapping('post', path)
}

/**
 * 映射此方法为Action，只允许put请求
 * @param path 映射到的路由，默认为action名称
 */
export function PutMapping(path: string = null) {
    return Mapping('put', path)
}

/**
 * 映射此方法为Action，只允许patch请求
 * @param path 映射到的路由，默认为action名称
 */
export function PatchMapping(path: string = null) {
    return Mapping('patch', path)
}

/**
 * 映射此方法为Action，只允许delete请求
 * @param path 映射到的路由，默认为action名称
 */
export function DeleteMapping(path: string = null) {
    return Mapping('delete', path)
}

/**
 * 映射此方法为Action，只允许head请求
 * @param path 映射到的路由，默认为action名称
 */
export function HeadMapping(path: string = null) {
    return Mapping('head', path)
}

/**
 * 绑定koa原生的context
 * 只能在Controller中使用
 */
export function BindContext(target: any, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: any) => [ctx, false]
}

/**
 * 绑定koa原生的request
 * 只能在Controller中使用
 */
export function BindRequest(target: any, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: any) => [ctx.request, false]
}

/**
 * 绑定koa原生的response
 * 只能在Controller中使用
 */
export function BindResponse(target: any, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: any) => [ctx.response, false]
}

/**
 * 绑定url中的query参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
export function BindQuery(key: string) {
    return function (target: any, name: string, index: number) {
        target[name].$params = target[name].$params || []
        target[name].$params[index] = (ctx: any) => [ctx.query[key], true]
    }
}

/**
 * 绑定url中的path参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
export function BindPath(key: string) {
    return function (target: any, name: string, index: number) {
        target[name].$params = target[name].$params || []
        target[name].$params[index] = (ctx: any) => [(ctx as any).params[key], true]
    }
}

/**
 * 只能在Controller中使用
 * 绑定请求体参数
 */
export function BindBody(target: any, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: any) => [ctx.request.body, true]
}

/**
 * 指定此字段需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export function Typed(sourceNameOrGetSourceNameFunc: string | ((targetName: string) => string) = null) {
    return function (target: any, name: string) {
        target.$fields = target.$fields || {}
        target.$fields[name] = new TypeSpecifiedMap(TypeSpecifiedType.General, Reflect.getMetadata('design:type', target, name), getSourceName(name, sourceNameOrGetSourceNameFunc))
    }
}

/**
 * 指定此Array字段的确切类型需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export function TypedArray(type: Function, sourceNameOrGetSourceNameFunc: string | ((targetName: string) => string) = null) {
    return function (target: any, name: string) {
        target.$fields = target.$fields || {}
        target.$fields[name] = new TypeSpecifiedMap(TypeSpecifiedType.Array, type, getSourceName(name, sourceNameOrGetSourceNameFunc))
    }
}

function getSourceName(targetName: string, sourceNameOrGetSourceNameFunc: string | Function = null) {
    if (!sourceNameOrGetSourceNameFunc) {
        return targetName
    }
    if (typeof sourceNameOrGetSourceNameFunc == 'string') {
        return sourceNameOrGetSourceNameFunc
    }
    return (sourceNameOrGetSourceNameFunc as Function)(targetName)
}

enum TypeSpecifiedType {
    General,
    Array
}

class TypeSpecifiedMap {
    constructor(typeSpecifiedType: TypeSpecifiedType, type: Function, sourceName: string) {
        this.typeSpecifiedType = typeSpecifiedType
        this.type = type
        this.sourceName = sourceName
    }
    typeSpecifiedType: TypeSpecifiedType
    type: Function
    sourceName: string
}

/**
 * 指定此Array类型需要验证其确切类型
 */
export function Valid(target: any, name: string) {
    target.$validator = target.$validator || {}
    target.$validator[name] = target.$validator[name] || []
}

/**
 * 用于自定义自己的验证器，所有dogboot内置验证器也是基于此来实现
 * @param func 验证规则
 */
export function Func(func: (arg0: any) => [boolean, string?]) {
    return function (target: any, name: string) {
        target.$validator = target.$validator || {}
        target.$validator[name] = target.$validator[name] || []
        target.$validator[name].push(async a => {
            let result = await func(a)
            if (!result[0]) {
                throw new IllegalArgumentException(result[1], target.constructor.name, name)
            }
        })
    }
}

/**
 * a != null
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export function NotNull(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null) {
            return [true]
        }
        return [false, errorMesage]
    })
}

/**
 * a != null && a.length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export function NotEmpty(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null && a.length > 0) {
            return [true]
        }
        return [false, errorMesage]
    })
}

/**
 * a != null && a.trim().length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export function NotBlank(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null && a.trim().length > 0) {
            return [true]
        }
        return [false, errorMesage]
    })
}

/**
 * 长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小长度
 * @param max 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${max} | 字段长度必须大于或等于${min} | 字段长度必须介于${min} ~ ${max}
 */
export function Length(min: number, max: number, errorMesage: string = null) {
    if (min == null) {
        errorMesage = errorMesage || `字段长度必须小于或等于${max}`
    } else if (max == null) {
        errorMesage = errorMesage || `字段长度必须大于或等于${min}`
    } else {
        errorMesage = errorMesage || `字段长度必须介于${min} ~ ${max}`
    }
    return Func(a => {
        if (a == null) {
            return [true]
        }
        if ((min != null && a.length < min) || (max != null && a.length > max)) {
            return [false, errorMesage]
        }
        return [true]
    })
}

/**
 * 最小长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小长度
 * @param errorMesage 错误消息，默认为：字段长度必须大于或等于${length}
 */
export function MinLength(length: number, errorMesage: string = null) {
    return Length(length, null, errorMesage)
}

/**
 * 最大长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${length}
 */
export function MaxLength(length: number, errorMesage: string = null) {
    return Length(null, length, errorMesage)
}

/**
 * 数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小数值
 * @param max 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${max} | 字段值必须大于或等于${min} | 字段值必须介于${min} ~ ${max}
 */
export function Range(min: number, max: number, errorMesage: string = null) {
    if (min == null) {
        errorMesage = errorMesage || `字段值必须小于或等于${max}`
    } else if (max == null) {
        errorMesage = errorMesage || `字段值必须大于或等于${min}`
    } else {
        errorMesage = errorMesage || `字段值必须介于${min} ~ ${max}`
    }
    return Func(a => {
        if (a == null) {
            return [true]
        }
        if ((min != null && a < min) || (max != null && a > max)) {
            return [false, errorMesage]
        }
        return [true]
    })
}

/**
 * 最小数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最小数值
 * @param errorMesage 错误消息，默认为：字段值必须大于或等于${val}
 */
export function Min(val: number, errorMesage: string = null) {
    return Range(val, null, errorMesage)
}

/**
 * 最大数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${val}
 */
export function Max(val: number, errorMesage: string = null) {
    return Range(null, val, errorMesage)
}

/**
 * 小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小的小数位长度
 * @param max 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${max} | 小数点位数必须大于或等于${min} | 小数点位数必须介于${min} ~ ${max}
 */
export function Decimal(min: number, max: number, errorMesage: string = null) {
    if (min == null) {
        errorMesage = errorMesage || `小数点位数必须小于或等于${max}`
    } else if (max == null) {
        errorMesage = errorMesage || `小数点位数必须大于或等于${min}`
    } else {
        errorMesage = errorMesage || `小数点位数必须介于${min} ~ ${max}`
    }
    return Func(a => {
        if (a == null) {
            return [true]
        }
        if ((min != null && a.length < min) || (max != null && a.length > max)) {
            return [false, errorMesage]
        }
        return [true]
    })
}

/**
 * 最小小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须大于或等于${length}
 */
export function MinDecimal(length: number, errorMesage: string = null) {
    return Decimal(length, null, errorMesage)
}

/**
 * 最大小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${length}
 */
export function MaxDecimal(length: number, errorMesage: string = null) {
    return Decimal(null, length, errorMesage)
}

/**
 * 正则表达式验证器，只能用于String的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param pattern 正则规则
 * @param errorMesage 错误消息，默认为：字段格式不符合要求
 */
export function Reg(pattern: RegExp, errorMesage: string = null) {
    errorMesage = errorMesage || '字段格式不符合要求'
    return Func(a => {
        if (a == null) {
            return [true]
        }
        if (!a.match(pattern)) {
            return [false, errorMesage]
        }
        return [true]
    })
}

/**
 * 请求参数不合法异常
 */
export class IllegalArgumentException extends Error {
    constructor(message: string, targetName: string, fieldName: string) {
        super(message)
        this.targetName = targetName
        this.fieldName = fieldName
    }
    targetName: string
    fieldName: string
}

/**
 * 表示一个html输出
 */
export class ViewResult {
    data: any

    constructor(data: any) {
        this.data = data
    }
}

/**
 * ActionFilter中DoBefore以及DoAfter方法接受到的参数
 */
export class ActionFilterContext {
    constructor(ctx: any, params: any[], paramTypes: Function[], controller: Function, action: string) {
        this.ctx = ctx
        this.params = params
        this.paramTypes = paramTypes
        this.controller = controller
        this.action = action
    }
    public readonly ctx: any
    params: any[]
    public readonly paramTypes: Function[]
    public readonly controller: Function
    public readonly action: string
}

/**
 * 指定Controller或者一个Action使用指定的Action过滤器
 * 只能用于Controller中
 * @param actionFilter 要使用的过滤器
 */
export function UseActionFilter(actionFilter: Function) {
    return function (target: any, name: string = null) {
        if (name == null) {
            target.prototype.$actionFilters = target.prototype.$actionFilters || []
            target.prototype.$actionFilters.unshift(actionFilter)
        } else {
            let action = target[name]
            action.$actionFilters = action.$actionFilters || []
            action.$actionFilters.unshift(actionFilter)
        }
    }
}

/**
 * 在ActionFilter标记一个方法，此方法将在Action执行前执行
 */
export function DoBefore(target: any, name: string) {
    target.$actionHandlerMap = target.$actionHandlerMap || new Map()
    target.$actionHandlerMap.set(DoBefore, name)
}

/**
 * 在ActionFilter标记一个方法，此方法将在Action执行后执行
 */
export function DoAfter(target: any, name: string) {
    target.$actionHandlerMap = target.$actionHandlerMap || new Map()
    target.$actionHandlerMap.set(DoAfter, name)
}

/**
 * 指定Controller或者一个Action使用指定的异常过滤器
 * 只能用于Controller中
 * @param exceptionFilter 要使用的过滤器
 */
export function UseExceptionFilter(exceptionFilter: Function) {
    return function (target: any, name: string = null) {
        if (name == null) {
            target.prototype.$exceptionFilter = exceptionFilter
        } else {
            let action = target[name]
            action.$exceptionFilter = exceptionFilter
        }
    }
}

/**
 * 在ExceptionFilter中，标记一个方法，用于处理指定类型的异常
 * @param type 要处理的异常类型
 */
export function ExceptionHandler(type: Function) {
    return function (target: any, name: string) {
        target.$exceptionHandlerMap = target.$exceptionHandlerMap || new Map()
        target.$exceptionHandlerMap.set(type, name)
    }
}

/**
 * 在组件中标记一个方法，使其在组件初始化时执行，支持异步方法
 */
export function Init(target: any, name: string) {
    target.$initMethod = name
}
