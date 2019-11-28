"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCache_1 = require("./BaseCache");
const DIContainer_1 = require("./DIContainer");
const Utils_1 = require("./Utils");
function Cachable(opts = { name: null, keys: [], maxAge: null }) {
    return function (target, name, desc) {
        opts.name = opts.name || `${target.constructor.name}:${name}`;
        opts.keys = opts.keys || [];
        let func = desc.value;
        desc.value = function () {
            return __awaiter(this, arguments, void 0, function* () {
                let keys = opts.keys.map(a => Utils_1.Utils.getValBySectionStr(arguments[a[0]], a[1]));
                let result = getCache().getByNameAndKeys(opts.name, keys);
                if (result == null) {
                    result = yield func.apply(this, arguments);
                    getCache().setByNameAndKeys(opts.name, keys, result, opts.maxAge);
                }
                return result;
            });
        };
    };
}
exports.Cachable = Cachable;
class UserCache extends BaseCache_1.BaseCache {
    constructor() {
        let opts = Utils_1.Utils.getConfigValue(BaseCache_1.CacheOptions);
        super(opts);
        DIContainer_1.getContainer().setComponentInstance(UserCache, this);
    }
}
let _instance;
function getCache() {
    if (_instance == null) {
        _instance = new UserCache();
    }
    return _instance;
}
exports.getCache = getCache;
//# sourceMappingURL=UserCache.js.map