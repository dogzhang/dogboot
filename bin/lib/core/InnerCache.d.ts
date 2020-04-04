import { CacheNode } from './CacheNode';
/**
 * 框架级别缓存选项
 */
export declare class InnerCachableOption {
    /**
     * 缓存名称，为空的话，使用class.name + methodName
     */
    name?: string;
    /**
     * 从参数中选取的key列表，[参数序号（从0开始）, 取值节点（比如：a.b）][]
     */
    keys?: [number, string][];
}
/**
 * 框架级别的缓存，应用开发不可以使用此缓存，仅供框架、库使用
 * @param opts
 */
export declare function InnerCachable(opts: InnerCachableOption): (target: any, name: string, desc: PropertyDescriptor) => void;
export declare function getInnerCache(): CacheNode;
