import { CacheNode } from './CacheNode';
import { Utils } from './Utils';

/**
 * 框架级别缓存选项
 */
export class InnerCachableOption {
    /**
     * 缓存名称，为空的话，使用class.name + methodName
     */
    name?: string

    /**
     * 从参数中选取的key列表，[参数序号（从0开始）, 取值节点（比如：a.b）][]
     */
    keys?: [number, string][]
}

/**
 * 框架级别的缓存，应用开发不可以使用此缓存，仅供框架、库使用
 * @param opts 
 */
export function InnerCachable(opts: InnerCachableOption) {
    return function (target: any, name: string, desc: PropertyDescriptor) {
        opts = opts ?? new InnerCachableOption()
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
            let result = getInnerCache().get(...keys)
            if (result == null) {
                result = func.apply(this, arguments)
                getInnerCache().set(result, null, ...keys)
            }
            return result
        }
    }
}

let _instance: CacheNode
export function getInnerCache() {
    if (_instance == null) {
        _instance = new CacheNode()
    }
    return _instance
}