import Koa = require('koa');
/**
 * ActionFilter中DoBefore以及DoAfter方法接受到的参数
 */
export declare class ActionFilterContext {
    readonly ctx: Koa.Context;
    readonly params: any[];
    readonly paramTypes: Function[];
    readonly controller: new (...args: any[]) => {};
    readonly action: string;
    constructor(ctx: Koa.Context, params: any[], paramTypes: Function[], controller: new (...args: any[]) => {}, action: string);
}
