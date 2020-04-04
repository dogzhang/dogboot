import { Utils } from './Utils';

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
        Reflect.defineMetadata('$isStartUp', true, target.prototype)
        Reflect.defineMetadata('$order', order, target.prototype)
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
 * 任何DoBefore导致ctx.status != 404都将阻止后续步骤的执行，但是Controller.Action执行成功后后续的DoAfter都会执行
 * ActionFilter是一种特殊的Component
 * @param opts order：优先级，值越大优先级越高，scope：作用域，匹配ctx.path，默认'/'表示作用于全部action
 */
export function GlobalActionFilter(opts?: { order?: number, scope?: string }) {
    return function (target: new (...args: any[]) => {}) {
        opts = opts || {}
        opts.order = opts.order ?? 0
        opts.scope = opts.scope ?? '/'
        Reflect.defineMetadata('$isGlobalActionFilter', true, target.prototype)
        Reflect.defineMetadata('$order', opts.order, target.prototype)
        Reflect.defineMetadata('$scope', opts.scope, target.prototype)
        Utils.markAsComponent(target)
    }
}

/**
 * 标记此类为局部请求过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，靠前的优先级更高
 * 配合UseActionFilter来使用
 */
export function ActionFilter(target: new (...args: any[]) => {}) {
    Reflect.defineMetadata('$isActionFilter', true, target.prototype)
    Utils.markAsComponent(target)
}

/**
 * 标记此类为全局异常过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 注意，ExceptionFilter的顺序没有明确规定，只能被一个处理器匹配到
 * ExceptionFilter是一种特殊的Component
 * @param scope 作用域限制，匹配ctx.path，默认'/'表示作用与全部action
 */
export function GlobalExceptionFilter(opts?: { scope?: string }) {
    return function (target: new (...args: any[]) => {}) {
        opts = opts || {}
        opts.scope = opts.scope ?? '/'
        Reflect.defineMetadata('$isGlobalExceptionFilter', true, target.prototype)
        Reflect.defineMetadata('$scope', opts.scope, target.prototype)
        Utils.markAsComponent(target)
    }
}

/**
 * 标记此类为局部异常过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，只会使用第一个
 * 配合UseExceptionFilter来使用
 */
export function ExceptionFilter(target: new (...args: any[]) => {}) {
    Reflect.defineMetadata('$isExceptionFilter', true, target.prototype)
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
        Reflect.defineMetadata('$isConfig', true, target.prototype)
        Reflect.defineMetadata('$configField', opts.field || '', target.prototype)
        Reflect.defineMetadata('$configName', opts.name || 'config.json', target.prototype)
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

        let $autowiredMap = Reflect.getMetadata('$autowiredMap', target) || new Map()
        $autowiredMap.set(name, type)
        Reflect.defineMetadata('$autowiredMap', $autowiredMap, target)
    }
}

/**
 * 在组件中标记一个方法，使其在组件初始化时执行，支持异步方法，并且会传入热更新前的实例作为参数
 */
export function Init(target: any, name: string) {
    Reflect.defineMetadata('$initMethod', name, target)
}

/**
 * 指定Controller或者一个Action使用指定的Action过滤器
 * 只能用于Controller中
 * @param actionFilter 要使用的过滤器
 */
export function UseActionFilter(actionFilter: new (...args: any[]) => {}) {
    return function (target: any, name: string = null) {
        if (!Reflect.getMetadata('$isActionFilter', actionFilter.prototype)) {
            console.warn(`UseActionFilter只能使用ActionFilter，此actionFilter不符合要求，${actionFilter.name}将不会生效`)
            return
        }
        if (name == null) {
            let $actionFilters = Reflect.getMetadata('$actionFilters', target.prototype) || []
            $actionFilters.unshift(actionFilter)
            Reflect.defineMetadata('$actionFilters', $actionFilters, target.prototype)
        } else {
            let $actionFilters = Reflect.getMetadata('$actionFilters', target, name) || []
            $actionFilters.unshift(actionFilter)
            Reflect.defineMetadata('$actionFilters', $actionFilters, target, name)
        }
    }
}

/**
 * 在ActionFilter标记一个方法，此方法将在Action执行前执行
 */
export function DoBefore(target: any, name: string) {
    let $actionHandlerMap = Reflect.getMetadata('$actionHandlerMap', target) || new Map()
    $actionHandlerMap.set(DoBefore, name)
    Reflect.defineMetadata('$actionHandlerMap', $actionHandlerMap, target)
}

/**
 * 在ActionFilter标记一个方法，此方法将在Action执行后执行
 */
export function DoAfter(target: any, name: string) {
    let $actionHandlerMap = Reflect.getMetadata('$actionHandlerMap', target) || new Map()
    $actionHandlerMap.set(DoAfter, name)
    Reflect.defineMetadata('$actionHandlerMap', $actionHandlerMap, target)
}

/**
 * 指定Controller或者一个Action使用指定的异常过滤器
 * 只能用于Controller中
 * @param exceptionFilter 要使用的过滤器
 */
export function UseExceptionFilter(exceptionFilter: new (...args: any[]) => {}) {
    return function (target: any, name: string = null) {
        if (!Reflect.getMetadata('$isExceptionFilter', exceptionFilter.prototype)) {
            console.warn(`UseExceptionFilter只能使用ExceptionFilter，此exceptionFilter不符合要求，${exceptionFilter.name}将不会生效`)
            return
        }
        if (name == null) {
            let $exceptionFilters = Reflect.getMetadata('$exceptionFilters', target.prototype) || []
            $exceptionFilters.unshift(exceptionFilter)
            Reflect.defineMetadata('$exceptionFilters', $exceptionFilters, target.prototype)
        } else {
            let $exceptionFilters = Reflect.getMetadata('$exceptionFilters', target, name) || []
            $exceptionFilters.unshift(exceptionFilter)
            Reflect.defineMetadata('$exceptionFilters', $exceptionFilters, target, name)
        }
    }
}

/**
 * 在ExceptionFilter中，标记一个方法，用于处理指定类型的异常
 * @param type 要处理的异常类型
 */
export function ExceptionHandler(type: new (...args: any[]) => Error | any) {
    return function (target: any, name: string) {
        let $exceptionHandlerMap = Reflect.getMetadata('$exceptionHandlerMap', target) || new Map()
        $exceptionHandlerMap.set(type, name)
        Reflect.defineMetadata('$exceptionHandlerMap', $exceptionHandlerMap, target)
    }
}

/**
 * 标记一个类为测试类，程序启动完成后，将会自动执行这些测试
 * 所有的测试类都必须放在test目录，或者另外指定的目录
 */
export function Test(target: new (...args: any[]) => {}) {
    Reflect.defineMetadata('$isTest', true, target.prototype)
    Utils.markAsComponent(target)
}

/**
 * 标记一个方法为测试方法，程序启动完成后，将会自动执行这些测试
 * 仅能在Test类中使用
 */
export function Spec(target: any, name: string) {
    let $testMethods = Reflect.getMetadata('$testMethods', target) || []
    $testMethods.push(name)
    Reflect.defineMetadata('$testMethods', $testMethods, target)
}

/**
 * 标记一个类或者方法，表示此类/方法唯一，dogboot的测试功能会检测only，当有任何类/方法被标记为only，测试将会跳过同一级别其他对象
 */
export function Only(target: any, name: string = null) {
    if (name == null) {
        Reflect.defineMetadata('$only', true, target.prototype)
    } else {
        Reflect.defineMetadata('$only', true, target, name)
        Reflect.defineMetadata('$only', true, target)
    }
}