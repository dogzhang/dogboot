"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCache_1 = require("./BaseCache");
const Utils_1 = require("./Utils");
function InnerCachable(opts = { name: null, keys: null }) {
    return function (target, name, desc) {
        opts.name = opts.name || `${target.constructor.name}:${name}`;
        opts.keys = opts.keys || [];
        let func = desc.value;
        desc.value = function () {
            let keys = opts.keys.map(a => Utils_1.Utils.getValBySectionStr(arguments[a[0]], a[1]));
            let result = getInnerCache().getByNameAndKeys(opts.name, keys);
            if (result == null) {
                result = func.apply(this, arguments);
                getInnerCache().setByNameAndKeys(opts.name, keys, result);
            }
            return result;
        };
    };
}
exports.InnerCachable = InnerCachable;
class InnerCache extends BaseCache_1.BaseCache {
    constructor() {
        super({});
    }
}
let _instance;
function getInnerCache() {
    if (_instance == null) {
        _instance = new InnerCache();
    }
    return _instance;
}
exports.getInnerCache = getInnerCache;
//# sourceMappingURL=InnerCache.js.map