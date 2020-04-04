"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 请求参数不合法异常
 */
class IllegalArgumentException extends Error {
    constructor(message, targetName, fieldName) {
        super(message);
        this.targetName = targetName;
        this.fieldName = fieldName;
    }
}
exports.IllegalArgumentException = IllegalArgumentException;
//# sourceMappingURL=IllegalArgumentException.js.map