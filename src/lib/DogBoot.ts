import fs = require('fs');
import path = require('path');
import chokidar = require('chokidar');
let { Module } = require("module");
import Koa = require('koa');
import Router = require('koa-router');
import koaBody = require('koa-body');
import koaStatic = require('koa-static');
import cors = require('koa2-cors')
import { Server } from 'http';
import http = require('http');
import 'reflect-metadata'

let oldLoadFunc = Module.prototype.load
Module.prototype.load = function (filename: string) {
    oldLoadFunc.call(this, filename)
    try {
        for (let p in this.exports) {
            let field = this.exports[p]
            if (field.prototype.$isComponent) {
                field.prototype.$filename = filename
            }
        }
    } catch{ }
}

export interface DIContainerOptions {
    enableHotload?: boolean
    hotloadDebounceInterval?: number
}
export class DIContainer {
    private componentInstanceMapKeyByFilenameAndClassName: Map<string, Map<string, any>> = new Map()
    private componentInstanceMap: Map<any, any>
    private watcher: chokidar.FSWatcher
    private opts: DIContainerOptions
    private configPathSet: Set<string> = new Set()

    constructor(opts: DIContainerOptions) {
        this.refresh(opts)
    }

    refresh(opts: DIContainerOptions) {
        this.opts = Object.assign({}, opts)
        if (this.opts.hotloadDebounceInterval == null) {
            this.opts.hotloadDebounceInterval = 100
        }
        this.componentInstanceMap = new Map()
        if (this.watcher) {
            this.watcher.close()
        }
        if (this.opts.enableHotload == true) {
            this.watch()
        }
    }

    private async watch() {
        this.watcher = chokidar.watch([Utils.getExecRootPath()], {
            ignoreInitial: true,
            ignorePermissionErrors: true
        })

        let st: NodeJS.Timeout
        this.watcher.on('all', () => {
            clearTimeout(st)
            st = setTimeout(() => {
                this.reload()
            }, this.opts.hotloadDebounceInterval)
        })
    }

    private reload() {
        Utils.getFileListInFolder(Utils.getExecRootPath()).forEach(a => {
            if (require.cache[a]) {
                delete require.cache[a]
            }
        })
        this.configPathSet.forEach(a => {
            delete require.cache[a]
        })
        this.configPathSet.clear()
        this.componentInstanceMap.clear()
        require(Utils.getEntryFilename())
    }

    /**
     * 设置组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * @param key 组件key，可以是任意值
     * @param instance 组件实例，可以是任意值
     */
    setComponentInstance(key: any, instance: any) {
        this.componentInstanceMap.set(key, instance)
    }

    /**
     * 根据key获取组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * @param key 组件key，可以是任意值
     */
    getComponentInstance<T>(key: any): T {
        return this.componentInstanceMap.get(key)
    }

    /**
     * 从工厂获取指定类型的组件实例，如果此组件类型没有一个可用实例，会创建一个实例然后返回给调用者
     * 这是一个异步方法，不能在构造器中起作用，所以请仅仅在程序启动的时候使用此方法
     * 程序运行中获取实例应该使用同步方法getComponentInstance
     * @param target 组件类型
     */
    async getComponentInstanceFromFactory(target: Function): Promise<any> {
        if (!target.prototype.$isComponent) {
            throw new Error(`${target.name}没有被注册为可自动解析的组件，请至少添加@Component、@StartUp、@Controller、@Config等装饰器中的一种`)
        }
        let instance = this.componentInstanceMap.get(target)
        if (instance) {
            return await instance
        }

        let instancePromise = this.createComponentInstance(target)
        this.componentInstanceMap.set(target, instancePromise)

        return instancePromise
    }

    private async createComponentInstance(target: Function): Promise<any> {
        let map = this.componentInstanceMapKeyByFilenameAndClassName.get(target.prototype.$filename) || new Map()
        let lastInstance = map.get(target.name)

        let instance = null
        if (target.prototype.$isConfig) {
            instance = this.getConfigValue(target)
        } else {
            instance = Reflect.construct(target, await this.getParamInstances(target))
            await this.resolveAutowiredDependences(instance)

            if (lastInstance) {
                if (target.prototype.$aliveFields) {
                    target.prototype.$aliveFields.forEach((a: string) => {
                        instance[a] = lastInstance[a]
                    })
                }
            }

            let initMethod = target.prototype.$initMethod
            if (initMethod) {
                await instance[initMethod](lastInstance)
            }
        }

        map.set(target.name, instance)
        this.componentInstanceMapKeyByFilenameAndClassName.set(target.prototype.$filename, map)

        this.componentInstanceMap.set(target, instance)

        return instance
    }

    private async getParamInstances(target: Function): Promise<any[]> {
        let paramTypes = target.prototype.$paramTypes
        let paramInstances = []
        for (let paramType of paramTypes) {
            let paramInstance = await this.getComponentInstanceFromFactory(paramType as any)
            paramInstances.push(paramInstance)
        }
        return paramInstances
    }

    private async resolveAutowiredDependences(instance: any) {
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

    private getConfigValue(target: Function) {
        let configName = target.prototype.$configName
        let configFilePath = Utils.getConfigFilename(configName)
        this.addConfigFilePath(configFilePath)
        let originalVal = require(configFilePath)
        let sectionArr = target.prototype.$configField.split('.').filter((a: any) => a)
        for (let a of sectionArr) {
            if (originalVal == null) {
                return null
            }
            originalVal = originalVal[a]
        }
        if (originalVal == null) {
            return null
        }
        return DogUtils.getTypeSpecifiedValue(target, originalVal)
    }

    private addConfigFilePath(configFilePath: string) {
        if (!this.opts.enableHotload) {
            return
        }
        if (this.configPathSet.has(configFilePath)) {
            return
        }
        this.configPathSet.add(configFilePath)
        this.watcher.add(configFilePath)
    }
}

/**
 * 包含一些公开的实用工具方法
 */
export class DogUtils {
    /**
     * 获取指定类型的对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValue<T>(type: Function, originalVal: any): T {
        if (originalVal == null) {
            return null
        }
        if (type == Number || type == String || type == Boolean) {
            return type(originalVal)
        }
        if (type == Date) {
            return new Date(originalVal) as any
        }
        let newVal = Reflect.construct(type, [])
        type.prototype.$fields && Object.entries(type.prototype.$fields).forEach(([k, v]) => {
            let typeSpecifiedMap: TypeSpecifiedMap = v as TypeSpecifiedMap
            if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.General) {
                newVal[k] = this.getTypeSpecifiedValue(typeSpecifiedMap.type, originalVal[typeSpecifiedMap.sourceName])
            } else if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.Array) {
                if (Array.isArray(originalVal[typeSpecifiedMap.sourceName])) {
                    newVal[k] = originalVal[typeSpecifiedMap.sourceName].map((a: any) => this.getTypeSpecifiedValue(typeSpecifiedMap.type, a))
                } else {
                    newVal[k] = null
                }
            }
        })
        return newVal
    }

    /**
     * 获取指定类型的数组对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValueArray<T>(type: Function, originalVal: any[]): T[] {
        if (originalVal == null) {
            return null
        }
        return originalVal.map(a => this.getTypeSpecifiedValue(type, a))
    }
}

/**
 * 仅仅被dogboot使用的内部工具方法
 */
class Utils {
    /**
     * 标记为组件
     * @param target 目标类型
     */
    static markAsComponent(target: Function) {
        target.prototype.$isComponent = true
        let paramTypes: Array<Function> = Reflect.getMetadata('design:paramtypes', target) || []
        if (paramTypes.includes(target)) {
            console.error(`${target.name}中存在自我依赖`)
            process.abort()
        }
        target.prototype.$paramTypes = paramTypes
    }

    /**
     * 获取指定目录下js或者ts文件列表
     * @param dirPath 指定的目录
     */
    static getFileListInFolder(dirPath: string) {
        let list = fs.readdirSync(dirPath)
        let fileList = []
        list.forEach(a => {
            let filePath = path.join(dirPath, a)
            let fileState = fs.statSync(filePath)
            if (fileState.isDirectory()) {
                fileList = fileList.concat(this.getFileListInFolder(filePath))
            } else {
                if ((filePath.endsWith('.ts') || filePath.endsWith('js')) && !filePath.endsWith('.d.ts')) {
                    fileList.push(filePath)
                }
            }
        })
        return fileList
    }

    private static getValidator(obj: any) {
        return obj != null && obj.__proto__ && obj.__proto__.$validator
    }

    /**
     * 验证模型是否合法，第一个不合法的字段会导致此方法抛出异常IllegalArgumentException
     * @param model 待验证的模型对象
     */
    static validateModel(model: any) {
        let validator = this.getValidator(model)
        if (!validator) {
            return
        }
        let entries = Object.entries(validator)
        for (let entrie of entries) {
            let k = entrie[0]
            let fieldVal = model[k]
            if (fieldVal instanceof Array) {
                for (let a of fieldVal) {
                    this.validateModel(a)
                }
            } else {
                this.validateModel(fieldVal)
            }
            let v = entrie[1]
            let funcList = v as Function[]
            for (let func of funcList) {
                func(fieldVal)
            }
        }
    }

    static sleep(milliseconds: number) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve()
            }, milliseconds)
        })
    }

    static getEntryFilename() {
        return process.env.dogbootEntry || process.mainModule.filename
    }

    static getAppRootPath() {
        return path.resolve(Utils.getEntryFilename(), '..', '..')
    }

    static getExecRootPath() {
        if (Utils.getEntryFilename().endsWith('.ts')) {
            return path.join(this.getAppRootPath(), 'src')
        } else {
            return path.join(this.getAppRootPath(), 'bin')
        }
    }

    static getConfigFilename(configName: string) {
        return path.join(this.getAppRootPath(), configName)
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
 * @param order 优先级，值越大越优先启动
 */
export function StartUp(order: number = 0) {
    return function (target: Function) {
        target.prototype.$isStartUp = true
        target.prototype.$order = order
        Utils.markAsComponent(target)
    }
}

/**
 * 标记此类为全局请求过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 请求过滤器作用方式遵循洋葱模型，执行顺序为：
 *     1、低优先级ActionFilter.DoBefore
 *     2、高优先级ActionFilter.DoBefore
 *     3、Controller.Action
 *     4、高优先级ActionFilter.DoAfter
 *     5、低优先级ActionFilter.DoAfter
 * 任何一步导致ctx.status != 404都将阻止后续步骤的执行
 * ActionFilter是一种特殊的Component
 * @param order 优先级，值越大优先级越高
 */
export function GlobalActionFilter(order: number = 0) {
    return function (target: Function) {
        target.prototype.$isActionFilter = true
        target.prototype.$order = order
        Utils.markAsComponent(target)
    }
}

/**
 * 标记此类为局部请求过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，靠前的优先级更高
 * 配合UseActionFilter来使用
 */
export function ActionFilter(target: Function) {
    target.prototype.$isFreeActionFilter = true
    Utils.markAsComponent(target)
}

/**
 * 标记此类为全局异常过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 注意，一个app只能有一个全局异常过滤器，请删除多余的全局异常过滤器，以免程序运行结果不符合预期
 * ExceptionFilter是一种特殊的Component
 */
export function GlobalExceptionFilter(target: Function) {
    target.prototype.$isExceptionFilter = true
    Utils.markAsComponent(target)
}

/**
 * 标记此类为局部异常过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，只会使用第一个
 * 配合UseExceptionFilter来使用
 */
export function ExceptionFilter(target: Function) {
    target.prototype.$isFreeExceptionFilter = true
    Utils.markAsComponent(target)
}

/**
 * 表示一个配置文件映射器
 * Config是一种特殊的Component
 * @param field 需要映射的节
 */
export function Config(opts?: { name?: string, field?: string }) {
    return function (target: Function) {
        opts = opts || {}
        target.prototype.$isConfig = true
        target.prototype.$configField = opts.field || ''
        target.prototype.$configName = opts.name || 'config.json'
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
        target.$validator[name].push(a => {
            let result = func(a)
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
 * 在组件中标记一个方法，使其在组件初始化时执行，支持异步方法
 */
export function Init(target: any, name: string) {
    target.$initMethod = name
}

/**
 * 指定Controller或者一个Action使用指定的Action过滤器
 * 只能用于Controller中
 * @param actionFilter 要使用的过滤器
 */
export function UseActionFilter(actionFilter: Function) {
    return function (target: any, name: string = null) {
        if (!actionFilter.prototype.$isFreeActionFilter) {
            console.warn(`UseActionFilter只能使用FreeActionFilter，此actionFilter(${actionFilter.name})将不会生效`)
            return
        }
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
 * ActionFilter中DoBefore以及DoAfter方法接受到的参数
 */
export class ActionFilterContext {
    constructor(readonly ctx: Koa.Context,
        readonly params: any[],
        readonly paramTypes: Function[],
        readonly controller: Function, readonly action: string) {
    }
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
 * 标记此字段在reload的时候，保持在内存中并且继承到新的实例
 */
export function KeepAlive(target: any, name: string) {
    target.$aliveFields = target.$aliveFields || []
    target.$aliveFields.push(name)
}

export interface DogBootOptions {
    prefix?: string
    staticRootPathName?: string
    controllerRootPathName?: string
    startupRootPathName?: string
    filterRootPathName?: string
    enableHotload?: boolean
    /**
     * 热更新监听文件变化的debounce，单位：毫秒，默认100
     */
    hotloadDebounceInterval?: number
    enableApidoc?: boolean
    apidocPrefix?: string

    /**
    * 设置html渲染器
    * @param render 一个渲染器函数，此函数接收以下参数
    * @param controllerFilePathArr 控制器相对于控制器根目录的路径拆分为数组，路径最后的Controller.js或者Controller.ts已经去除
    * @param actionName Action名称，取方法名称，而不是映射的路由地址，比如：GetMapping('/getname') getName(){} -> getName
    * @param data 渲染页面的数据
    * 渲染器需要返回一个字符串，这个字符串就是最终渲染出来的html
    */
    render?: (controllerFilePathArr: string[], actionName: string, data: any) => string

    /**
     * 是否允许跨域
     */
    enableCors?: boolean

    /**
     * 跨域选项，dogboot使用koa2-cors这个包实现跨域，参见https://github.com/zadzbw/koa2-cors
     */
    corsOptions?: {
        origin?: string | ((ctx: Koa.Context) => boolean | string);
        exposeHeaders?: string[];
        maxAge?: number;
        credentials?: boolean;
        allowMethods?: string[];
        allowHeaders?: string[];
    }
}

let appMap: Map<number, DogBootApplication> = new Map()

@Component
export class DogBootApplication {
    app = new Koa()
    server: Server

    private container: DIContainer
    private readyToAcceptRequest: boolean
    private globalExceptionFilter: Function
    private render: (controllerFilePathArr: string[], actionName: string, data: any) => string
    private globalActionFilters: Function[]
    private requestHandler: Function
    private controllerClasses: Function[]
    private prefix: string
    private staticRootPathName: string
    private controllerRootPathName: string
    private startupRootPathName: string
    private filterRootPathName: string
    private enableApidoc: boolean
    private apidocPrefix: string
    private enableCors: boolean
    private corsOptions: {
        origin?: string | ((ctx: Koa.Context) => boolean | string);
        exposeHeaders?: string[];
        maxAge?: number;
        credentials?: boolean;
        allowMethods?: string[];
        allowHeaders?: string[];
    }

    static create(port: number = 3000, _opts?: DogBootOptions) {
        let opts = _opts || {}

        let app: DogBootApplication
        let lastApp = appMap.get(port)
        if (lastApp) {
            app = lastApp
            app.init(opts)
        } else {
            app = new DogBootApplication(port, opts)
            appMap.set(port, app)
        }
        return app
    }

    private constructor(private readonly port: number = 3000, opts: DogBootOptions) {
        this.init(opts)
    }
    private init(opts: DogBootOptions) {
        this.readyToAcceptRequest = false
        this.globalExceptionFilter = null
        this.globalActionFilters = []
        this.render = opts.render
        this.requestHandler = null
        this.controllerClasses = []
        this.prefix = opts.prefix
        this.staticRootPathName = opts.staticRootPathName || 'public'
        this.controllerRootPathName = opts.controllerRootPathName || 'controller'
        this.startupRootPathName = opts.startupRootPathName || 'startup'
        this.filterRootPathName = opts.filterRootPathName || 'filter'
        this.enableApidoc = opts.enableApidoc != null ? opts.enableApidoc : false
        this.apidocPrefix = opts.apidocPrefix || 'apidoc'
        this.enableCors = opts.enableCors != null ? opts.enableCors : false
        this.corsOptions = opts.corsOptions

        let diContainerOptions: DIContainerOptions = {
            enableHotload: opts.enableHotload,
            hotloadDebounceInterval: opts.hotloadDebounceInterval
        }
        if (!this.container) {
            this.container = new DIContainer(diContainerOptions)
        } else {
            this.container.refresh(diContainerOptions)
        }

        this.container.setComponentInstance(DogBootApplication, this)
    }
    private build() {
        let publicRootPath = path.join(Utils.getAppRootPath(), this.staticRootPathName)
        this.app.use(koaStatic(publicRootPath))
        this.app.use(koaBody())

        if (this.enableCors) {
            this.app.use(cors(this.corsOptions))
        }

        let controllerRootPath = path.join(Utils.getExecRootPath(), this.controllerRootPathName)
        let spiltStr = '/'
        if (process.platform == 'win32') {
            spiltStr = '\\'
        }
        Utils.getFileListInFolder(controllerRootPath).forEach(a => {
            let controllerFilePathArr = path.relative(controllerRootPath, a).replace(/Controller\.(ts|js)$/i, '').split(spiltStr)
            this.checkAndHandleControllerFile(a, controllerFilePathArr)
        })
    }
    private checkAndHandleControllerFile(filePath: string, controllerFilePathArr: string[]) {
        let _Module = require(filePath)
        Object.values(_Module).filter(a => a instanceof Function && a.prototype.$isController).forEach((a: Function) => { this.checkAndHandleControllerClass(a, controllerFilePathArr) })
    }
    private checkAndHandleControllerClass(_Class: Function, controllerFilePathArr: string[]) {
        let _prototype = _Class.prototype
        let controllerPath = _prototype.$path
        let prefix = ''
        let areaPrefixArr = controllerFilePathArr.slice(0, controllerFilePathArr.length - 1)
        if (areaPrefixArr.length) {
            prefix += '/' + areaPrefixArr.join('/')
        }
        prefix += controllerPath
        let router = new Router({
            prefix
        })
        Object.getOwnPropertyNames(_prototype).forEach(a => {
            this.checkAndHandleActionName(a, _Class, controllerFilePathArr, router)
        })
        if (this.prefix) {
            router.prefix(this.prefix)
        }
        this.app.use(router.routes())

        this.controllerClasses.push(_Class)
    }
    private checkAndHandleActionName(actionName: string, _Class: Function, controllerFilePathArr: string[], router: any) {
        let _prototype = _Class.prototype
        let action = _prototype[actionName]
        if (!action.$method) {
            return
        }
        router[action.$method](action.$path, async (ctx: Koa.Context) => {
            while (!this.readyToAcceptRequest) {
                await Utils.sleep(200)
            }
            try {
                await this.handleContext(actionName, _Class, controllerFilePathArr, ctx)
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
    private async handleContext(actionName: string, _Class: Function, controllerFilePathArr: string[], ctx: Koa.Context) {
        let _prototype = _Class.prototype
        let instance = await this.container.getComponentInstanceFromFactory(_prototype.constructor)
        let $params = instance[actionName].$params || []//使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
        let $paramTypes: Function[] = instance[actionName].$paramTypes || []//全部的参数类型
        let params = $params.map((b: Function, idx: number) => {
            let originalValArr = b(ctx)
            let originalVal = originalValArr[0]
            let typeSpecified = originalValArr[1]
            let toType = $paramTypes[idx]
            if (typeSpecified && toType) {
                return DogUtils.getTypeSpecifiedValue(toType, originalVal)
            } else {
                return originalVal
            }
        })
        for (let b of params) {
            Utils.validateModel(b)
        }
        let actionFilterContext = new ActionFilterContext(ctx, params, $paramTypes, _Class, actionName)

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
            await filterInstance[handlerName](actionFilterContext)
            if (ctx.status != 404) {
                break
            }
        }

        if (ctx.status == 404) {
            let body = await instance[actionName](...params)

            if (ctx.status == 404) {
                if (body instanceof ViewResult) {
                    if (this.render) {
                        ctx.body = await this.render(controllerFilePathArr, actionName, body.data)
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
            await filterInstance[handlerName](actionFilterContext)
        }
    }
    private async startUp() {
        let startupRootPath = path.join(Utils.getExecRootPath(), this.startupRootPathName)
        if (!fs.existsSync(startupRootPath)) {
            return
        }
        let startUpFileList = Utils.getFileListInFolder(startupRootPath)
        let startUpClassList = []
        for (let filePath of startUpFileList) {
            let _Module = require(filePath)
            Object.values(_Module).forEach(a => {
                if (a instanceof Function) {
                    startUpClassList.push(a)
                }
            })
        }
        startUpClassList = startUpClassList.filter(a => a.prototype.$isStartUp).sort((a, b) => b.prototype.$order - a.prototype.$order)
        for (let startUp of startUpClassList) {
            await this.container.getComponentInstanceFromFactory(startUp as Function)
        }
    }

    private async initComponents() {
        for (let componentClass of this.controllerClasses) {
            await this.container.getComponentInstanceFromFactory(componentClass as Function)
        }
    }

    private async initFilters() {
        let filterRootPath = path.join(Utils.getExecRootPath(), this.filterRootPathName)
        if (!fs.existsSync(filterRootPath)) {
            return
        }
        let filterFileList = Utils.getFileListInFolder(filterRootPath)
        let filterClassList = []
        for (let filePath of filterFileList) {
            let _Module = require(filePath)
            Object.values(_Module).forEach(a => {
                if (a instanceof Function) {
                    filterClassList.push(a)
                }
            })
        }
        this.globalActionFilters = filterClassList.filter(a => a.prototype.$isActionFilter).sort((a, b) => b.prototype.$order - a.prototype.$order)
        this.globalExceptionFilter = filterClassList.find(a => a.prototype.$isExceptionFilter)
        for (let filter of this.globalActionFilters) {
            await this.container.getComponentInstanceFromFactory(filter as Function)
        }
        if (this.globalExceptionFilter) {
            await this.container.getComponentInstanceFromFactory(this.globalExceptionFilter as Function)
        }
    }

    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    async runAsync() {
        let startTime = Date.now()
        this.app.middleware = []
        this.build()
        this.requestHandler = this.app.callback()

        let lastServer = this.server
        if (!lastServer) {
            this.server = http.createServer((req, res) => {
                this.requestHandler(req, res)
            }).listen(this.port)
        }

        await this.startUp()
        await this.initComponents()
        await this.initFilters()
        this.readyToAcceptRequest = true
        let endTime = Date.now()
        console.log(`Your application has ${lastServer ? 'reloaded' : 'started'} at ${this.port} in ${endTime - startTime}ms`)
        return this
    }
}

/**
 * 指定此类为控制器
 * Controller是一种特殊的Component
 * @param path 映射到的路由，默认取类名前一部分，比如HomeController默认映射到/Home，Home也映射到/Home
 */
export function Controller(path: string = null) {
    return function (target: Function) {
        if (path == null) {
            target.prototype.$path = '/' + target.name.replace(/Controller$/i, '')
        } else {
            target.prototype.$path = path
        }
        target.prototype.$isController = true
        Utils.markAsComponent(target)
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
        if (path == null) {
            action.$path = '/' + action.name
        } else {
            action.$path = path
        }
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
 * 表示一个html输出
 */
export class ViewResult {
    data: any

    constructor(data: any) {
        this.data = data
    }
}