import { Utils } from "./Utils";

/**
 * 指定此类为组件，生命周期将完全交给dogboot管理
 * 所有组件将在程序启动的时候初始化完成，所有组件初始化完成后，程序才会开始接受http请求
 * @param target 
 */
export function Component(target: new (...args: any[]) => {}) {
    Utils.markAsComponent(target)
}

/**
 * 指定此类为预启动组件，将在程序启动时预先启动。
 * 事实上，所有的组件只要被使用到都会在程序启动时预先启动，使用StartUp标记那些没有被其他组件使用的组件，确保此组件也能启动
 * StartUp是一种特殊的Component
 * @param order 优先级，值越大越优先启动，默认值：0
 */
export function StartUp(order: number = 0) {
    return function (target: new (...args: any[]) => {}) {
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
    return function (target: new (...args: any[]) => {}) {
        target.prototype.$isGlobalActionFilter = true
        target.prototype.$order = order
        Utils.markAsComponent(target)
    }
}

/**
 * 标记此类为局部请求过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，靠前的优先级更高
 * 配合UseActionFilter来使用
 */
export function ActionFilter(target: new (...args: any[]) => {}) {
    target.prototype.$isActionFilter = true
    Utils.markAsComponent(target)
}

/**
 * 标记此类为全局异常过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 注意，一个app只能有一个全局异常过滤器，请删除多余的全局异常过滤器，以免程序运行结果不符合预期
 * ExceptionFilter是一种特殊的Component
 */
export function GlobalExceptionFilter(target: new (...args: any[]) => {}) {
    target.prototype.$isGlobalExceptionFilter = true
    Utils.markAsComponent(target)
}

/**
 * 标记此类为局部异常过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，只会使用第一个
 * 配合UseExceptionFilter来使用
 */
export function ExceptionFilter(target: new (...args: any[]) => {}) {
    target.prototype.$isExceptionFilter = true
    Utils.markAsComponent(target)
}

/**
 * 表示一个配置文件映射器
 * Config是一种特殊的Component
 * @param field 需要映射的节
 */
export function Config(opts?: { name?: string, field?: string }) {
    return function (target: new (...args: any[]) => {}) {
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
export function Autowired(type: (new (...args: any[]) => {}) | (() => new (...args: any[]) => {})) {
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
export function UseActionFilter(actionFilter: new (...args: any[]) => {}) {
    return function (target: any, name: string = null) {
        if (!actionFilter.prototype.$isActionFilter) {
            console.warn(`UseActionFilter只能使用ActionFilter，此actionFilter不符合要求，(${actionFilter.name})将不会生效`)
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
 * 指定Controller或者一个Action使用指定的异常过滤器
 * 只能用于Controller中
 * @param exceptionFilter 要使用的过滤器
 */
export function UseExceptionFilter(exceptionFilter: new (...args: any[]) => {}) {
    return function (target: any, name: string = null) {
        if (!exceptionFilter.prototype.$isExceptionFilter) {
            console.warn(`UseExceptionFilter只能使用ExceptionFilter，此exceptionFilter不符合要求，(${exceptionFilter.name})将不会生效`)
            return
        }
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
export function ExceptionHandler(type: new (...args: any[]) => Error | any) {
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

/**
 * 标记一个类为测试类，程序启动完成后，将会自动执行这些测试
 * 所有的测试类都必须放在test目录，或者另外指定的目录
 */
export function Test(target: new (...args: any[]) => {}) {
    target.prototype.$isTest = true
    Utils.markAsComponent(target)
}

/**
 * 标记一个方法为测试方法，程序启动完成后，将会自动执行这些测试
 * 仅能在Test类中使用
 */
export function Spec(target: any, name: string) {
    target.$testMethods = target.$testMethods || []
    target.$testMethods.push(name)
}