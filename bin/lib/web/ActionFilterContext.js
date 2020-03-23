"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ActionFilter中DoBefore以及DoAfter方法接受到的参数
 */
class ActionFilterContext {
    constructor(ctx, params, paramTypes, controller, action) {
        this.ctx = ctx;
        this.params = params;
        this.paramTypes = paramTypes;
        this.controller = controller;
        this.action = action;
    }
}
exports.ActionFilterContext = ActionFilterContext;
//# sourceMappingURL=ActionFilterContext.js.map