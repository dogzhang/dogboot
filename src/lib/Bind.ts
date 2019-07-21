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