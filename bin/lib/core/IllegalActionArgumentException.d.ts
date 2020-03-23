/**
 * Action的请求参数不合法异常，Action内参数上的验证器验证失败时会导致这个异常
 */
export declare class IllegalActionArgumentException extends Error {
    constructor(message: string, targetName: string, actionName: string, index: number);
    targetName: string;
    actionName: string;
    index: number;
}
