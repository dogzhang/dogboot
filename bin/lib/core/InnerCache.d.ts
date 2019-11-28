import { BaseCache } from './BaseCache';
export declare function InnerCachable(opts?: {
    name?: string;
    keys?: [number, string][];
}): (target: any, name: string, desc: PropertyDescriptor) => void;
declare class InnerCache extends BaseCache {
    constructor();
}
export declare function getInnerCache(): InnerCache;
export {};
