/// <reference types="node" />
import Koa = require('koa');
import { Server } from 'http';
import 'reflect-metadata';
export interface DIContainerOptions {
    enableHotload?: boolean;
    hotloadDebounceInterval?: number;
}
export declare class DIContainer {
    private componentInstanceMapKeyByFilenameAndClassName;
    private componentInstanceMap;
    private watcher;
    private opts;
    private configPathSet;
    constructor(opts: DIContainerOptions);
    refresh(opts: DIContainerOptions): void;
    private watch;
    private reload;
    /**
     * 设置组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * @param key 组件key，可以是任意值
     * @param instance 组件实例，可以是任意值
     */
    setComponentInstance(key: any, instance: any): void;
    /**
     * 根据key获取组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * @param key 组件key，可以是任意值
     */
    getComponentInstance<T>(key: any): T;
    /**
     * 从工厂获取指定类型的组件实例，如果此组件类型没有一个可用实例，会创建一个实例然后返回给调用者
     * 这是一个异步方法，不能在构造器中起作用，所以请仅仅在程序启动的时候使用此方法
     * 程序运行中获取实例应该使用同步方法getComponentInstance
     * @param target 组件类型
     */
    getComponentInstanceFromFactory(target: Function): Promise<any>;
    private createComponentInstance;
    private getParamInstances;
    private resolveAutowiredDependences;
    private getConfigValue;
    private addConfigFilePath;
}
/**
 * 包含一些公开的实用工具方法
 */
export declare class DogUtils {
    /**
     * 获取指定类型的对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValue<T>(type: Function, originalVal: any): T;
    /**
     * 获取指定类型的数组对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValueArray<T>(type: Function, originalVal: any[]): T[];
}
/**
 * 指定此类为组件，生命周期将完全交给dogboot管理
 * 所有组件将在程序启动的时候初始化完成，所有组件初始化完成后，程序才会开始接受http请求
 * @param target
 */
export declare function Component(target: Function): void;
/**
 * 指定此类为预启动组件，将在程序启动时预先启动。
 * 事实上，所有的组件只要被使用到都会在程序启动时预先启动，使用StartUp标记那些没有被其他组件使用的组件，确保此组件也能启动
 * StartUp是一种特殊的Component
 * @param order 优先级，值越大越优先启动
 */
export declare function StartUp(order?: number): (target: Function) => void;
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
export declare function GlobalActionFilter(order?: number): (target: Function) => void;
/**
 * 标记此类为局部请求过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，靠前的优先级更高
 * 配合UseActionFilter来使用
 */
export declare function ActionFilter(target: Function): void;
/**
 * 标记此类为全局异常过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 注意，一个app只能有一个全局异常过滤器，请删除多余的全局异常过滤器，以免程序运行结果不符合预期
 * ExceptionFilter是一种特殊的Component
 */
export declare function GlobalExceptionFilter(target: Function): void;
/**
 * 标记此类为局部异常过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，只会使用第一个
 * 配合UseExceptionFilter来使用
 */
export declare function ExceptionFilter(target: Function): void;
/**
 * 表示一个配置文件映射器
 * Config是一种特殊的Component
 * @param field 需要映射的节
 */
export declare function Config(opts?: {
    name?: string;
    field?: string;
}): (target: Function) => void;
/**
 * 通过属性注入依赖的组件
 * @param type
 */
export declare function Autowired(type: Function): (target: any, name: string) => void;
/**
 * 指定此字段需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export declare function Typed(sourceNameOrGetSourceNameFunc?: string | ((targetName: string) => string)): (target: any, name: string) => void;
/**
 * 指定此Array字段的确切类型需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export declare function TypedArray(type: Function, sourceNameOrGetSourceNameFunc?: string | ((targetName: string) => string)): (target: any, name: string) => void;
/**
 * 指定此Array类型需要验证其确切类型
 */
export declare function Valid(target: any, name: string): void;
/**
 * 用于自定义自己的验证器，所有dogboot内置验证器也是基于此来实现
 * @param func 验证规则
 */
export declare function Func(func: (arg0: any) => [boolean, string?]): (target: any, name: string) => void;
/**
 * a != null
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export declare function NotNull(errorMesage?: string): (target: any, name: string) => void;
/**
 * a != null && a.length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export declare function NotEmpty(errorMesage?: string): (target: any, name: string) => void;
/**
 * a != null && a.trim().length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export declare function NotBlank(errorMesage?: string): (target: any, name: string) => void;
/**
 * 长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小长度
 * @param max 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${max} | 字段长度必须大于或等于${min} | 字段长度必须介于${min} ~ ${max}
 */
export declare function Length(min: number, max: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最小长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小长度
 * @param errorMesage 错误消息，默认为：字段长度必须大于或等于${length}
 */
export declare function MinLength(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最大长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${length}
 */
export declare function MaxLength(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小数值
 * @param max 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${max} | 字段值必须大于或等于${min} | 字段值必须介于${min} ~ ${max}
 */
export declare function Range(min: number, max: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最小数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最小数值
 * @param errorMesage 错误消息，默认为：字段值必须大于或等于${val}
 */
export declare function Min(val: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最大数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${val}
 */
export declare function Max(val: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小的小数位长度
 * @param max 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${max} | 小数点位数必须大于或等于${min} | 小数点位数必须介于${min} ~ ${max}
 */
export declare function Decimal(min: number, max: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最小小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须大于或等于${length}
 */
export declare function MinDecimal(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最大小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${length}
 */
export declare function MaxDecimal(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 正则表达式验证器，只能用于String的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param pattern 正则规则
 * @param errorMesage 错误消息，默认为：字段格式不符合要求
 */
export declare function Reg(pattern: RegExp, errorMesage?: string): (target: any, name: string) => void;
/**
 * 请求参数不合法异常
 */
export declare class IllegalArgumentException extends Error {
    constructor(message: string, targetName: string, fieldName: string);
    targetName: string;
    fieldName: string;
}
/**
 * 在组件中标记一个方法，使其在组件初始化时执行，支持异步方法
 */
export declare function Init(target: any, name: string): void;
/**
 * 指定Controller或者一个Action使用指定的Action过滤器
 * 只能用于Controller中
 * @param actionFilter 要使用的过滤器
 */
export declare function UseActionFilter(actionFilter: Function): (target: any, name?: string) => void;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行前执行
 */
export declare function DoBefore(target: any, name: string): void;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行后执行
 */
export declare function DoAfter(target: any, name: string): void;
/**
 * ActionFilter中DoBefore以及DoAfter方法接受到的参数
 */
export declare class ActionFilterContext {
    readonly ctx: Koa.Context;
    readonly params: any[];
    readonly paramTypes: Function[];
    readonly controller: Function;
    readonly action: string;
    constructor(ctx: Koa.Context, params: any[], paramTypes: Function[], controller: Function, action: string);
}
/**
 * 指定Controller或者一个Action使用指定的异常过滤器
 * 只能用于Controller中
 * @param exceptionFilter 要使用的过滤器
 */
export declare function UseExceptionFilter(exceptionFilter: Function): (target: any, name?: string) => void;
/**
 * 在ExceptionFilter中，标记一个方法，用于处理指定类型的异常
 * @param type 要处理的异常类型
 */
export declare function ExceptionHandler(type: Function): (target: any, name: string) => void;
/**
 * 标记此字段在reload的时候，保持在内存中并且继承到新的实例
 */
export declare function KeepAlive(target: any, name: string): void;
export interface DogBootOptions {
    prefix?: string;
    staticRootPathName?: string;
    controllerRootPathName?: string;
    startupRootPathName?: string;
    filterRootPathName?: string;
    enableHotload?: boolean;
    /**
     * 热更新监听文件变化的debounce，单位：毫秒，默认100
     */
    hotloadDebounceInterval?: number;
    enableApidoc?: boolean;
    apidocPrefix?: string;
    /**
    * 设置html渲染器
    * @param render 一个渲染器函数，此函数接收以下参数
    * @param controllerFilePathArr 控制器相对于控制器根目录的路径拆分为数组，路径最后的Controller.js或者Controller.ts已经去除
    * @param actionName Action名称，取方法名称，而不是映射的路由地址，比如：GetMapping('/getname') getName(){} -> getName
    * @param data 渲染页面的数据
    * 渲染器需要返回一个字符串，这个字符串就是最终渲染出来的html
    */
    render?: (controllerFilePathArr: string[], actionName: string, data: any) => string;
}
export declare class DogBootApplication {
    private readonly port;
    app: Koa<any, {}>;
    server: Server;
    private container;
    private readyToAcceptRequest;
    private globalExceptionFilter;
    private render;
    private globalActionFilters;
    private requestHandler;
    private controllerClasses;
    private prefix;
    private staticRootPathName;
    private controllerRootPathName;
    private startupRootPathName;
    private filterRootPathName;
    private enableApidoc;
    private apidocPrefix;
    static create(port?: number, _opts?: DogBootOptions): DogBootApplication;
    private constructor();
    private init;
    private build;
    private checkAndHandleControllerFile;
    private checkAndHandleControllerClass;
    private checkAndHandleActionName;
    private handleContext;
    private startUp;
    private initComponents;
    private initFilters;
    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    runAsync(): Promise<this>;
}
/**
 * 指定此类为控制器
 * Controller是一种特殊的Component
 * @param path 映射到的路由，默认取类名前一部分，比如HomeController默认映射到/Home，Home也映射到/Home
 */
export declare function Controller(path?: string): (target: Function) => void;
/**
 * 映射此方法为Action
 * @param type method类型，默认为get
 * @param path 映射到的路由，默认为action名称
 */
export declare function Mapping(type?: string, path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，允许所有类型的method请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function AllMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许get请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function GetMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许post请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function PostMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许put请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function PutMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许patch请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function PatchMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许delete请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function DeleteMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许head请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function HeadMapping(path?: string): (target: any, name: string) => void;
/**
 * 绑定koa原生的context
 * 只能在Controller中使用
 */
export declare function BindContext(target: any, name: string, index: number): void;
/**
 * 绑定koa原生的request
 * 只能在Controller中使用
 */
export declare function BindRequest(target: any, name: string, index: number): void;
/**
 * 绑定koa原生的response
 * 只能在Controller中使用
 */
export declare function BindResponse(target: any, name: string, index: number): void;
/**
 * 绑定url中的query参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
export declare function BindQuery(key: string): (target: any, name: string, index: number) => void;
/**
 * 绑定url中的path参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
export declare function BindPath(key: string): (target: any, name: string, index: number) => void;
/**
 * 只能在Controller中使用
 * 绑定请求体参数
 */
export declare function BindBody(target: any, name: string, index: number): void;
/**
 * 表示一个html输出
 */
export declare class ViewResult {
    data: any;
    constructor(data: any);
}
