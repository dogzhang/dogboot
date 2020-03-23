import { CacheNode } from './CacheNode';
import { Utils } from './Utils';

/**
 * 应用级别缓存选项
 */
export class CachableOption {
    /**
     * 缓存名称，为空的话，使用class.name + methodName
     */
    name?: string

    /**
     * 从参数中选取的key列表，[参数序号（从0开始）, 取值节点（比如：a.b）][]
     */
    keys?: [number, string][]

    /**
     * 缓存时长，单位：毫秒，默认为空，表示永久有效
     */
    maxAge?: number
}

/**
 * 应用级别的缓存，应用开发可以使用此缓存
 * @param opts 
 */
export function Cachable(opts?: CachableOption) {
    return function (target: any, name: string, desc: PropertyDescriptor) {
        opts = opts ?? new CachableOption()
        opts.keys = opts.keys ?? []

        let func = desc.value
        desc.value = function () {
            let keys = opts.keys.map(a => Utils.getValBySectionStr(arguments[a[0]], a[1]))
            if (opts.name) {
                keys.unshift(opts.name)
            } else {
                keys.unshift(name)
                keys.unshift(target.constructor.name)
            }
            let result = getCache().get(...keys)
            if (result == null) {
                result = func.apply(this, arguments)
                getCache().set(result, opts.maxAge, ...keys)
            }
            return result
        }
    }
}

let _instance: CacheNode
export function getCache() {
    if (_instance == null) {
        _instance = new CacheNode()
    }
    return _instance
}