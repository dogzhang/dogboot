import LRUCache = require("lru-cache")
import { Config } from './Component';
import { Typed } from './TypeConvert';

/**
 * 缓存选项，dogboot使用lru-cache这个包实现缓存，参见https://github.com/isaacs/node-lru-cache
 * 使用者只需要配置max、maxAge、updateAgeOnGet三个参数，其余参数有dogboot默认指定
 */
@Config({ field: 'app.cacheOptions' })
export class CacheOptions {
    /**
     * The maximum size of the cache, checked by applying the length
     * function to all values in the cache. Not setting this is kind of silly,
     * since that's the whole purpose of this lib, but it defaults to `Infinity`.
     */
    @Typed()
    max?: number;

    /**
     * Maximum age in ms. Items are not pro-actively pruned out as they age,
     * but if you try to get an item that is too old, it'll drop it and return
     * undefined instead of giving it to you.
     */
    @Typed()
    maxAge?: number;

    /**
     * When using time-expiring entries with `maxAge`, setting this to `true` will make each
     * item's effective time update to the current time whenever it is retrieved from cache,
     * causing it to not expire. (It can still fall out of cache based on recency of use, of
     * course.)
     */
    @Typed()
    updateAgeOnGet?: boolean;
}

export class BaseCache extends LRUCache<string, any>{
    constructor(options: CacheOptions) {
        super(options)
    }

    private getKeyByNameAndKeys(name: string, keys: any[]) {
        return [name, ...keys].join(':')
    }

    getByNameAndKeys(name: string, keys: any[]) {
        let key = this.getKeyByNameAndKeys(name, keys)
        return super.get(key)
    }

    setByNameAndKeys(name: string, keys: any[], val: any, maxAge?: number) {
        let key = this.getKeyByNameAndKeys(name, keys)
        return super.set(key, val, maxAge)
    }

    deleteByNameAndKeys(name: string, keys: any[]) {
        let key = this.getKeyByNameAndKeys(name, keys)
        super.del(key)
    }
}