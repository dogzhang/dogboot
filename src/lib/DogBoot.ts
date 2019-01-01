import fs = require('fs');
import path = require('path');
import Router = require('koa-router');
import koaBody = require('koa-body');
import koaStatic = require('koa-static');
import * as Koa from 'koa'
import 'reflect-metadata'
import { Server } from 'net';

let serviceMap: Map<any, any> = new Map()
let classInstanceMap: Map<Function, any> = new Map()

export class DogBootApplication {
    app: Koa
    server: Server
    private port: number = 3000
    private globalExceptionFilter: Function
    private render: Function
    private globalActionFilters: Function[] = []
    constructor(private controllerPath: string) {
        this.app = new Koa()
        return this
    }
    private build() {
        this.app.use(koaStatic(
            path.join(process.cwd(), 'public')
        ))
        this.app.use(koaBody())
        Utils.getFileListInFolder(this.controllerPath).forEach(async (filePath: string) => {
            let _Module = require(filePath)
            Object.values(_Module).filter(a => a instanceof Function).forEach((_Class: Function) => {
                let _prototype = _Class.prototype
                let controllerPath = _prototype.$path
                if (!controllerPath) {
                    return
                }
                let router = new Router({
                    prefix: controllerPath
                })
                let controllerName = _Class.name.replace(/controller$/i, '').toLowerCase()
                Object.getOwnPropertyNames(_prototype).forEach(a => {
                    let action = _prototype[a]
                    if (action.$method) {
                        router[action.$method](action.$path, async (ctx: Koa.Context) => {
                            try {
                                ctx.state.app = this
                                let instance = await Utils.componentFactory(_Class.prototype.constructor, ctx)
                                let $params = instance[a].$params || []//使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
                                let $paramTypes: Function[] = instance[a].$paramTypes || []//全部的参数类型
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

                                let actionContext = new ActionFilterContext(ctx, params, $paramTypes, _Class, a)

                                let actionFiltersOnController = _prototype.$actionFilters = _prototype.$actionFilters || []
                                let actionFiltersOnAction = instance[a].$actionFilters || []
                                let actionFilters = this.globalActionFilters.concat(actionFiltersOnController, actionFiltersOnAction)
                                let actionFilterAndInstances: [Function, any][] = []
                                for (let actionFilter of actionFilters) {
                                    let handlerName = actionFilter.prototype.$actionHandlerMap.get(DoBefore)
                                    if (!handlerName) {
                                        continue
                                    }
                                    let filterInstance = await Utils.componentFactory(actionFilter, ctx) as any
                                    actionFilterAndInstances.push([actionFilter, filterInstance])
                                    await filterInstance[handlerName](actionContext)
                                    if (ctx.status != 404) {
                                        break
                                    }
                                }

                                if (ctx.status == 404) {
                                    let body = await instance[a](...params)

                                    if (ctx.status == 404) {
                                        if (body instanceof ViewResult) {
                                            if (this.render) {
                                                ctx.body = await this.render(controllerName, a, body.data)
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
                            } catch (err) {
                                let exceptionFilter = _prototype[a].$exceptionFilter || _prototype.$exceptionFilter || this.globalExceptionFilter
                                if (!exceptionFilter) {
                                    throw err
                                }
                                let exceptionFilterInstance = await Utils.componentFactory(exceptionFilter, ctx) as any
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
                })
                this.app.use(router.routes())
            })
        })
    }
    addService(key: any, service: any) {
        serviceMap.set(key, service)
        return this
    }
    setPort(port: number) {
        this.port = port
        return this
    }
    setRender(render: (controllerName: string, actionName: string, data: any) => string) {
        this.render = render
        return this
    }
    useExceptionFilter(exceptionFilter: Function) {
        this.globalExceptionFilter = exceptionFilter
        return this
    }
    useActionFilter(actionFilter: Function) {
        this.globalActionFilters.push(actionFilter)
        return this
    }
    run() {
        this.build()
        this.server = this.app.listen(this.port)
        return this
    }
}

class Utils {
    static markAsComponent(target: Function, lifetime: ComponentLifetime) {
        target.prototype.$lifetime = lifetime
        let paramTypes: Array<Function> = Reflect.getMetadata('design:paramtypes', target) || []
        if (paramTypes.includes(target)) {
            console.error(`${target.name}中存在自我依赖`)
            process.abort()
        }
        target.prototype.$paramTypes = paramTypes
    }

    static async componentFactory(target: Function, ctx: Koa.Context): Promise<any> {
        let lifetime = target.prototype.$lifetime as ComponentLifetime
        if (lifetime == null) {
            throw new Error(`${target.name}没有被注册为可自动解析的组件，请至少添加@Controller、@Component、@ActionFilter、@ExceptionFilter、@Config等装饰器中的一种`)
        }
        if (lifetime == ComponentLifetime.Transient) {
            return await this.createComponentInstance(new Map(), target, ctx)
        } else if (lifetime == ComponentLifetime.Scoped) {
            ctx.state.classInstanceMap = ctx.state.classInstanceMap || new Map()
            return await this.createComponentInstance(ctx.state.classInstanceMap, target, ctx)
        } else if (lifetime == ComponentLifetime.Singleton) {
            return await this.createComponentInstance(classInstanceMap, target, ctx)
        }
    }

    static async createComponentInstance(containerMap: Map<Function, any>, target: Function, ctx: Koa.Context): Promise<any> {
        let instance = containerMap.get(target)
        if (instance == null) {
            if (target.prototype.$isConfig) {
                instance = this.getConfigValue(target)
                containerMap.set(target, instance)
            } else {
                instance = Reflect.construct(target, await Utils.getParamInstances(target, ctx))
                containerMap.set(target, instance)
                await this.resolveAutowiredDependences(instance, ctx)
                let initMethod = target.prototype.$initMethod
                if (initMethod) {
                    await instance[initMethod]()
                }
            }
        }
        return instance
    }

    static async getParamInstances(target: Function, ctx: Koa.Context): Promise<any[]> {
        let paramTypes = target.prototype.$paramTypes
        let paramInstances = []
        for (let paramType of paramTypes) {
            let paramInstance = await Utils.componentFactory(paramType as any, ctx)
            paramInstances.push(paramInstance)
        }
        return paramInstances
    }

    static async resolveAutowiredDependences(instance, ctx: Koa.Context) {
        let target = instance.__proto__.constructor
        let autowiredMap = target.prototype.$autowiredMap
        if (autowiredMap) {
            for (let [k, v] of autowiredMap) {
                if (v.name) {
                    instance[k] = await Utils.componentFactory(v as any, ctx)
                } else {
                    let _Class = v()
                    instance[k] = await Utils.componentFactory(_Class as any, ctx)
                }
            }
        }
    }

    static getConfigValue(target: Function) {
        let oldVal = require(path.join(process.cwd(), 'config.json'))
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

    static getFileListInFolder(dirPath: string) {
        let list = fs.readdirSync(dirPath)
        let fileList = []
        list.forEach(a => {
            let filePath = path.join(dirPath, a)
            let fileState = fs.statSync(filePath)
            if (fileState.isDirectory()) {
                fileList = fileList.concat(Utils.getFileListInFolder(filePath))
            } else {
                fileList.push(filePath)
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
        Object.assign(newVal, oldVal)
        type.prototype.$fields && Object.entries(type.prototype.$fields).forEach(([k, v]) => {
            if (newVal.hasOwnProperty(k)) {
                let typeSpecifiedMap: TypeSpecifiedMap = v as TypeSpecifiedMap
                if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.General) {
                    newVal[k] = this.getTypeSpecifiedValue(typeSpecifiedMap.type, newVal[k])
                } else if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.Array) {
                    newVal[k] = newVal[k].map(a => this.getTypeSpecifiedValue(typeSpecifiedMap.type, a))
                }
            }
        })
        return newVal
    }
}

export enum ComponentLifetime {
    /**
     * 全局唯一
     */
    Singleton,
    /**
     * 每一次请求只有一个
     */
    Scoped,
    /**
     * 每次new一个
     */
    Transient
}

export function Component(lifetime: ComponentLifetime = ComponentLifetime.Singleton) {
    return function (target: Function) {
        Utils.markAsComponent(target, lifetime)
    }
}

export function Controller(path: string = null, lifetime: ComponentLifetime = ComponentLifetime.Transient) {
    return function (target: Function) {
        target.prototype.$path = path || '/' + target.name.replace(/controller$/i, '')
        Utils.markAsComponent(target, lifetime)
    }
}

export function ActionFilter(lifetime: ComponentLifetime = ComponentLifetime.Singleton) {
    return function (target: Function) {
        Utils.markAsComponent(target, lifetime)
    }
}

export function ExceptionFilter(lifetime: ComponentLifetime = ComponentLifetime.Singleton) {
    return function (target: Function) {
        Utils.markAsComponent(target, lifetime)
    }
}

export function Config(field: string = null) {
    return function (target: Function) {
        target.prototype.$isConfig = true
        target.prototype.$configField = field
        Utils.markAsComponent(target, ComponentLifetime.Singleton)
    }
}

export function Autowired(type: Function) {
    return function (target, name: string) {
        if (!type) {
            console.error(`${target.constructor.name}中存在不正确的循环依赖${name}，请使用@Autowired(() => type of ${name})注入此依赖项`)
            process.abort()
        }
        target.$autowiredMap = target.$autowiredMap || new Map()
        target.$autowiredMap.set(name, type)
    }
}

export function Mapping(type: string = 'get', path: string = null) {
    return function (target, name: string) {
        let action = target[name]
        action.$method = type.toLowerCase()
        action.$path = path || '/' + action.name
        action.$paramTypes = Reflect.getMetadata('design:paramtypes', target, name)
    }
}

export function AllMapping(path: string = null) {
    return Mapping('all', path)
}

export function GetMapping(path: string = null) {
    return Mapping('get', path)
}

export function PostMapping(path: string = null) {
    return Mapping('post', path)
}

export function BindContext(target, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: Koa.Context) => [ctx, false]
}

export function BindRequest(target, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: Koa.Context) => [ctx.request, false]
}

export function BindResponse(target, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: Koa.Context) => [ctx.response, false]
}

export function BindQuery(key: string) {
    return function (target, name: string, index: number) {
        target[name].$params = target[name].$params || []
        target[name].$params[index] = (ctx: Koa.Context) => [ctx.query[key], true]
    }
}

export function BindPath(key: string) {
    return function (target, name: string, index: number) {
        target[name].$params = target[name].$params || []
        target[name].$params[index] = (ctx: Koa.Context) => [(ctx as any).params[key], true]
    }
}

export function BindBody(target, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: Koa.Context) => [ctx.request.body, true]
}

export function BindApp(target, name: string, index: number) {
    target[name].$params = target[name].$params || []
    target[name].$params[index] = (ctx: Koa.Context) => [ctx.state.app, true]
}

export function TypeSpecified(target, name: string) {
    target.$fields = target.$fields || {}
    target.$fields[name] = new TypeSpecifiedMap(TypeSpecifiedType.General, Reflect.getMetadata('design:type', target, name))
}

export function TypeSpecifiedArray(type: Function) {
    return function (target, name: string) {
        target.$fields = target.$fields || {}
        target.$fields[name] = new TypeSpecifiedMap(TypeSpecifiedType.Array, type)
    }
}

enum TypeSpecifiedType {
    General,
    Array
}

class TypeSpecifiedMap {
    constructor(typeSpecifiedType: TypeSpecifiedType, type: Function) {
        this.typeSpecifiedType = typeSpecifiedType
        this.type = type
    }
    typeSpecifiedType: TypeSpecifiedType
    type: Function
}

export function Valid(target, name: string) {
    target.$validator = target.$validator || {}
    target.$validator[name] = target.$validator[name] || []
}

export function Func(func: (arg0: any) => [boolean, string?]) {
    return function (target, name: string) {
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

export function NotNull(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null) {
            return [true]
        }
        return [false, errorMesage]
    })
}

export function NotEmpty(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null && a.length > 0) {
            return [true]
        }
        return [false, errorMesage]
    })
}

export function NotBlank(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null && a.trim().length > 0) {
            return [true]
        }
        return [false, errorMesage]
    })
}

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

export function MinLength(length: number, errorMesage: string = null) {
    return Length(length, null, errorMesage)
}

export function MaxLength(length: number, errorMesage: string = null) {
    return Length(null, length, errorMesage)
}

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

export function Min(length: number, errorMesage: string = null) {
    return Range(length, null, errorMesage)
}

export function Max(length: number, errorMesage: string = null) {
    return Range(null, length, errorMesage)
}

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

export function MinDecimal(length: number, errorMesage: string = null) {
    return Decimal(length, null, errorMesage)
}

export function MaxDecimal(length: number, errorMesage: string = null) {
    return Decimal(null, length, errorMesage)
}

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

export class IllegalArgumentException extends Error {
    constructor(message: string, targetName: string, fieldName: string) {
        super(message)
        this.targetName = targetName
        this.fieldName = fieldName
    }
    targetName: string
    fieldName: string
}

export class ViewResult {
    data: any

    constructor(data: any) {
        this.data = data
    }
}

export class ActionFilterContext {
    constructor(ctx: Koa.Context, params: any[], paramTypes: Function[], controller: Function, action: string) {
        this.ctx = ctx
        this.params = params
        this.paramTypes = paramTypes
        this.controller = controller
        this.action = action
    }
    public readonly ctx: Koa.Context
    params: any[]
    public readonly paramTypes: Function[]
    public readonly controller: Function
    public readonly action: string
}

export function UseActionFilter(actionFilter: Function) {
    return function (target, name: string = null) {
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

export function DoBefore(target, name: string) {
    target.$actionHandlerMap = target.$actionHandlerMap || new Map()
    target.$actionHandlerMap.set(DoBefore, name)
}

export function DoAfter(target, name: string) {
    target.$actionHandlerMap = target.$actionHandlerMap || new Map()
    target.$actionHandlerMap.set(DoAfter, name)
}

export function UseExceptionFilter(exceptionFilter: Function) {
    return function (target, name: string = null) {
        if (name == null) {
            target.prototype.$exceptionFilter = exceptionFilter
        } else {
            let action = target[name]
            action.$exceptionFilter = exceptionFilter
        }
    }
}

export function ExceptionHandler(type: Function) {
    return function (target, name: string) {
        target.$exceptionHandlerMap = target.$exceptionHandlerMap || new Map()
        target.$exceptionHandlerMap.set(type, name)
    }
}

export function Init(target, name: string) {
    target.$initMethod = name
}

@Component()
export class ServiceContainer {
    getService<T>(key: any): T {
        return serviceMap.get(key)
    }
}
