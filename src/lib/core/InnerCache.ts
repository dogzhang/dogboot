import { BaseCache } from './BaseCache';
import { Utils } from './Utils';

export function InnerCachable(opts: { name?: string, keys?: [number, string][] } = { name: null, keys: null }) {
    return function (target: any, name: string, desc: PropertyDescriptor) {
        opts.name = opts.name || `${target.constructor.name}:${name}`
        opts.keys = opts.keys || []

        let func = desc.value
        desc.value = function () {
            let keys = opts.keys.map(a => Utils.getValBySectionStr(arguments[a[0]], a[1]))
            let result = getInnerCache().getByNameAndKeys(opts.name, keys)
            if (result == null) {
                result = func.apply(this, arguments)
                getInnerCache().setByNameAndKeys(opts.name, keys, result)
            }
            return result
        }
    }
}

class InnerCache extends BaseCache {
    constructor() {
        super({})
    }
}

let _instance: InnerCache
export function getInnerCache() {
    if(_instance == null){
        _instance = new InnerCache()
    }
    return _instance
}