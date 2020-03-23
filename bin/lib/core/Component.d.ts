/**
 * 指定此类为组件，生命周期将完全交给dogboot管理
 * 所有组件将在程序启动的时候初始化完成，所有组件初始化完成后，程序才会开始接受http请求
 * @param target
 */
export declare function Component(target: new (...args: any[]) => {}): void;
/**
 * 指定此类为预启动组件，将在程序启动时预先启动。
 * 事实上，所有的组件只要被使用到都会在程序启动时预先启动，使用StartUp标记那些没有被其他组件使用的组件，确保此组件也能启动
 * StartUp是一种特殊的Component
 * @param order 优先级，值越大越优先启动，默认值：0
 */
export declare function StartUp(order?: number): (target: new (...args: any[]) => {}) => void;
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
export declare function GlobalActionFilter(opts?: {
    order?: number;
    scope?: string;
}): (target: new (...args: any[]) => {}) => void;
/**
 * 标记此类为局部请求过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，靠前的优先级更高
 * 配合UseActionFilter来使用
 */
export declare function ActionFilter(target: new (...args: any[]) => {}): void;
/**
 * 标记此类为全局异常过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 注意，ExceptionFilter的顺序没有明确规定，只能被一个处理器匹配到
 * ExceptionFilter是一种特殊的Component
 * @param scope 作用域限制，匹配ctx.path，默认'/'表示作用与全部action
 */
export declare function GlobalExceptionFilter(opts?: {
    scope?: string;
}): (target: new (...args: any[]) => {}) => void;
/**
 * 标记此类为局部异常过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，只会使用第一个
 * 配合UseExceptionFilter来使用
 */
export declare function ExceptionFilter(target: new (...args: any[]) => {}): void;
/**
 * 表示一个配置文件映射器
 * Config是一种特殊的Component
 * @param field 需要映射的节
 */
export declare function Config(opts?: {
    name?: string;
    field?: string;
}): (target: new (...args: any[]) => {}) => void;
/**
 * 通过属性注入依赖的组件
 * @param type
 */
export declare function Autowired(type: (new (...args: any[]) => {}) | (() => new (...args: any[]) => {})): (target: any, name: string) => void;
/**
 * 在组件中标记一个方法，使其在组件初始化时执行，支持异步方法，并且会传入热更新前的实例作为参数
 */
export declare function Init(target: any, name: string): void;
/**
 * 指定Controller或者一个Action使用指定的Action过滤器
 * 只能用于Controller中
 * @param actionFilter 要使用的过滤器
 */
export declare function UseActionFilter(actionFilter: new (...args: any[]) => {}): (target: any, name?: string) => void;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行前执行
 */
export declare function DoBefore(target: any, name: string): void;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行后执行
 */
export declare function DoAfter(target: any, name: string): void;
/**
 * 指定Controller或者一个Action使用指定的异常过滤器
 * 只能用于Controller中
 * @param exceptionFilter 要使用的过滤器
 */
export declare function UseExceptionFilter(exceptionFilter: new (...args: any[]) => {}): (target: any, name?: string) => void;
/**
 * 在ExceptionFilter中，标记一个方法，用于处理指定类型的异常
 * @param type 要处理的异常类型
 */
export declare function ExceptionHandler(type: new (...args: any[]) => Error | any): (target: any, name: string) => void;
/**
 * 标记一个类为测试类，程序启动完成后，将会自动执行这些测试
 * 所有的测试类都必须放在test目录，或者另外指定的目录
 */
export declare function Test(target: new (...args: any[]) => {}): void;
/**
 * 标记一个方法为测试方法，程序启动完成后，将会自动执行这些测试
 * 仅能在Test类中使用
 */
export declare function Spec(target: any, name: string): void;
