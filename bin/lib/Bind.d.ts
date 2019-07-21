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
