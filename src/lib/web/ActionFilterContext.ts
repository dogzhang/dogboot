import Koa = require('koa');

/**
 * ActionFilter中DoBefore以及DoAfter方法接受到的参数
 */
export class ActionFilterContext {
    constructor(readonly ctx: Koa.Context,
        readonly params: any[],
        readonly paramTypes: Function[],
        readonly controller: new (...args: any[]) => {}, readonly action: string) {
    }
}