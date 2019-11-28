import { BaseCache, CacheOptions } from './BaseCache';
import { getContainer } from './DIContainer';
import { Utils } from './Utils';

export function Cachable(opts: { name?: string, keys?: [number, string][], maxAge?: number } = { name: null, keys: [], maxAge: null }) {
    return function (target: any, name: string, desc: PropertyDescriptor) {
        opts.name = opts.name || `${target.constructor.name}:${name}`
        opts.keys = opts.keys || []

        let func = desc.value
        desc.value = async function () {
            let keys = opts.keys.map(a => Utils.getValBySectionStr(arguments[a[0]], a[1]))
            let result = getCache().getByNameAndKeys(opts.name, keys)
            if (result == null) {
                result = await func.apply(this, arguments)
                getCache().setByNameAndKeys(opts.name, keys, result, opts.maxAge)
            }
            return result
        }
    }
}

class UserCache extends BaseCache {
    constructor() {
        let opts = Utils.getConfigValue(CacheOptions)
        super(opts)
        getContainer().setComponentInstance(UserCache, this)
    }
}

let _instance: UserCache
export function getCache() {
    if (_instance == null) {
        _instance = new UserCache()
    }
    return _instance
}