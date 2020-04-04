import { CacheNode } from './CacheNode';
/**
 * 应用级别缓存选项
 */
export declare class CachableOption {
    /**
     * 缓存名称，为空的话，使用class.name + methodName
     */
    name?: string;
    /**
     * 从参数中选取的key列表，[参数序号（从0开始）, 取值节点（比如：a.b）][]
     */
    keys?: [number, string][];
    /**
     * 缓存时长，单位：毫秒，默认为空，表示永久有效
     */
    maxAge?: number;
}
/**
 * 应用级别的缓存，应用开发可以使用此缓存
 * @param opts
 */
export declare function Cachable(opts?: CachableOption): (target: any, name: string, desc: PropertyDescriptor) => void;
export declare function getCache(): CacheNode;
