"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Action的请求参数不合法异常，Action内参数上的验证器验证失败时会导致这个异常
 */
class IllegalActionArgumentException extends Error {
    constructor(message, targetName, actionName, index) {
        super(message);
        this.targetName = targetName;
        this.actionName = actionName;
        this.index = index;
    }
}
exports.IllegalActionArgumentException = IllegalActionArgumentException;
//# sourceMappingURL=IllegalActionArgumentException.js.map