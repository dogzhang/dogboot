export declare class CacheNode {
    private readonly parent?;
    private readonly key?;
    private _value;
    private expireTime;
    private children;
    constructor(parent?: CacheNode, key?: any);
    private get value();
    private set value(value);
    private check;
    private checkValue;
    private checkChildren;
    get(...keys: any[]): any;
    set(val: any, maxAge: number, ...keys: any[]): void;
    delete(...keys: any[]): void;
    private removeMyself;
    private clear;
}
