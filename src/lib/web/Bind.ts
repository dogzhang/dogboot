import Koa = require('koa');

function Bind(target: any, name: string, index: number, func: (ctx: Koa.Context) => [any, boolean]) {
    let $params = Reflect.getMetadata('$params', target, name) || []
    $params[index] = func
    Reflect.defineMetadata('$params', $params, target, name)
}

/**
 * 绑定koa原生的context
 * 只能在Controller中使用
 */
export function BindContext(target: any, name: string, index: number) {
    Bind(target, name, index, (ctx: Koa.Context) => [ctx, false])
}

/**
 * 绑定koa原生的request
 * 只能在Controller中使用
 */
export function BindRequest(target: any, name: string, index: number) {
    Bind(target, name, index, (ctx: Koa.Context) => [ctx.request, false])
}

/**
 * 绑定koa原生的response
 * 只能在Controller中使用
 */
export function BindResponse(target: any, name: string, index: number) {
    Bind(target, name, index, (ctx: Koa.Context) => [ctx.response, false])
}

/**
 * 绑定url中的query参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
export function BindQuery(key: string) {
    return function (target: any, name: string, index: number) {
        Bind(target, name, index, (ctx: Koa.Context) => [ctx.query[key], true])
    }
}

/**
 * 绑定url中的path参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
export function BindPath(key: string) {
    return function (target: any, name: string, index: number) {
        Bind(target, name, index, (ctx: Koa.Context) => [ctx.params[key], true])
    }
}

/**
 * 绑定header中的参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
export function BindHeader(key: string) {
    return function (target: any, name: string, index: number) {
        Bind(target, name, index, (ctx: Koa.Context) => [ctx.headers[key], true])
    }
}

/**
 * 只能在Controller中使用
 * 绑定请求体参数
 */
export function BindBody(target: any, name: string, index: number) {
    Bind(target, name, index, (ctx: Koa.Context) => [ctx.request.body, true])
}