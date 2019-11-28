"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const LRUCache = require("lru-cache");
const Component_1 = require("./Component");
const TypeConvert_1 = require("./TypeConvert");
/**
 * 缓存选项，dogboot使用lru-cache这个包实现缓存，参见https://github.com/isaacs/node-lru-cache
 * 使用者只需要配置max、maxAge、updateAgeOnGet三个参数，其余参数有dogboot默认指定
 */
let CacheOptions = class CacheOptions {
};
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", Number)
], CacheOptions.prototype, "max", void 0);
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", Number)
], CacheOptions.prototype, "maxAge", void 0);
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", Boolean)
], CacheOptions.prototype, "updateAgeOnGet", void 0);
CacheOptions = __decorate([
    Component_1.Config({ field: 'app.cacheOptions' })
], CacheOptions);
exports.CacheOptions = CacheOptions;
class BaseCache extends LRUCache {
    constructor(options) {
        super(options);
    }
    getKeyByNameAndKeys(name, keys) {
        return [name, ...keys].join(':');
    }
    getByNameAndKeys(name, keys) {
        let key = this.getKeyByNameAndKeys(name, keys);
        return super.get(key);
    }
    setByNameAndKeys(name, keys, val, maxAge) {
        let key = this.getKeyByNameAndKeys(name, keys);
        return super.set(key, val, maxAge);
    }
    deleteByNameAndKeys(name, keys) {
        let key = this.getKeyByNameAndKeys(name, keys);
        super.del(key);
    }
}
exports.BaseCache = BaseCache;
//# sourceMappingURL=BaseCache.js.map