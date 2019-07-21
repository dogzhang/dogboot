/**
 * 请求参数不合法异常
 */
export declare class IllegalArgumentException extends Error {
    constructor(message: string, targetName: string, fieldName: string);
    targetName: string;
    fieldName: string;
}
