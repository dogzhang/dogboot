"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CacheNode_1 = require("./CacheNode");
const Utils_1 = require("./Utils");
/**
 * 框架级别缓存选项
 */
class InnerCachableOption {
}
exports.InnerCachableOption = InnerCachableOption;
/**
 * 框架级别的缓存，应用开发不可以使用此缓存，仅供框架、库使用
 * @param opts
 */
function InnerCachable(opts) {
    return function (target, name, desc) {
        var _a;
        opts = opts !== null && opts !== void 0 ? opts : new InnerCachableOption();
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
            let result = getInnerCache().get(...keys);
            if (result == null) {
                result = func.apply(this, arguments);
                getInnerCache().set(result, null, ...keys);
            }
            return result;
        };
    };
}
exports.InnerCachable = InnerCachable;
let _instance;
function getInnerCache() {
    if (_instance == null) {
        _instance = new CacheNode_1.CacheNode();
    }
    return _instance;
}
exports.getInnerCache = getInnerCache;
//# sourceMappingURL=InnerCache.js.map