import { BaseCache } from './BaseCache';
export declare function Cachable(opts?: {
    name?: string;
    keys?: [number, string][];
    maxAge?: number;
}): (target: any, name: string, desc: PropertyDescriptor) => void;
declare class UserCache extends BaseCache {
    constructor();
}
export declare function getCache(): UserCache;
export {};
