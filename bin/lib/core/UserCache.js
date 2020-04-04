"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CacheNode_1 = require("./CacheNode");
const Utils_1 = require("./Utils");
/**
 * 应用级别缓存选项
 */
class CachableOption {
}
exports.CachableOption = CachableOption;
/**
 * 应用级别的缓存，应用开发可以使用此缓存
 * @param opts
 */
function Cachable(opts) {
    return function (target, name, desc) {
        var _a;
        opts = opts !== null && opts !== void 0 ? opts : new CachableOption();
        opts.keys = (_a = opts.keys) !== null && _a !== void 0 ? _a : [];
        let func = desc.value;
        desc.value = function () {
            let keys = opts.keys.map(a => Utils_1.Utils.getValBySectionStr(arguments[a[0]], a[1]));
            if (opts.name) {
                keys.unshift(opts.name);
            }
            else {
                keys.unshift(name);
                keys.unshift(target.constructor.name);
            }
            let result = getCache().get(...keys);
            if (result == null) {
                result = func.apply(this, arguments);
                getCache().set(result, opts.maxAge, ...keys);
            }
            return result;
        };
    };
}
exports.Cachable = Cachable;
let _instance;
function getCache() {
    if (_instance == null) {
        _instance = new CacheNode_1.CacheNode();
    }
    return _instance;
}
exports.getCache = getCache;
//# sourceMappingURL=UserCache.js.map