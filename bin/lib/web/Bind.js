"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Bind(target, name, index, func) {
    let $params = Reflect.getMetadata('$params', target, name) || [];
    $params[index] = func;
    Reflect.defineMetadata('$params', $params, target, name);
}
/**
 * 绑定koa原生的context
 * 只能在Controller中使用
 */
function BindContext(target, name, index) {
    Bind(target, name, index, (ctx) => [ctx, false]);
}
exports.BindContext = BindContext;
/**
 * 绑定koa原生的request
 * 只能在Controller中使用
 */
function BindRequest(target, name, index) {
    Bind(target, name, index, (ctx) => [ctx.request, false]);
}
exports.BindRequest = BindRequest;
/**
 * 绑定koa原生的response
 * 只能在Controller中使用
 */
function BindResponse(target, name, index) {
    Bind(target, name, index, (ctx) => [ctx.response, false]);
}
exports.BindResponse = BindResponse;
/**
 * 绑定url中的query参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
function BindQuery(key) {
    return function (target, name, index) {
        Bind(target, name, index, (ctx) => [ctx.query[key], true]);
    };
}
exports.BindQuery = BindQuery;
/**
 * 绑定url中的path参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
function BindPath(key) {
    return function (target, name, index) {
        Bind(target, name, index, (ctx) => [ctx.params[key], true]);
    };
}
exports.BindPath = BindPath;
/**
 * 绑定header中的参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
function BindHeader(key) {
    return function (target, name, index) {
        Bind(target, name, index, (ctx) => [ctx.headers[key], true]);
    };
}
exports.BindHeader = BindHeader;
/**
 * 只能在Controller中使用
 * 绑定请求体参数
 */
function BindBody(target, name, index) {
    Bind(target, name, index, (ctx) => [ctx.request.body, true]);
}
exports.BindBody = BindBody;
//# sourceMappingURL=Bind.js.map