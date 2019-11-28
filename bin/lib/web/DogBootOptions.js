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
const core_1 = require("../core");
const CorsOptions_1 = require("./CorsOptions");
let DogBootOptions = class DogBootOptions {
    constructor() {
        this.port = 3000;
        this.prefix = '';
        this.enableApidoc = false;
        /**
         * 是否允许跨域
         */
        this.enableCors = false;
        /**
         * 跨域选项，dogboot使用koa2-cors这个包实现跨域，参见https://github.com/zadzbw/koa2-cors
         */
        this.corsOptions = new CorsOptions_1.CorsOptions();
    }
};
__decorate([
    core_1.Typed(),
    __metadata("design:type", Number)
], DogBootOptions.prototype, "port", void 0);
__decorate([
    core_1.Typed(),
    __metadata("design:type", String)
], DogBootOptions.prototype, "prefix", void 0);
__decorate([
    core_1.Typed(),
    __metadata("design:type", Boolean)
], DogBootOptions.prototype, "enableApidoc", void 0);
__decorate([
    core_1.Typed(),
    __metadata("design:type", Boolean)
], DogBootOptions.prototype, "enableCors", void 0);
__decorate([
    core_1.Typed(),
    __metadata("design:type", CorsOptions_1.CorsOptions)
], DogBootOptions.prototype, "corsOptions", void 0);
DogBootOptions = __decorate([
    core_1.Config({ field: 'app' })
], DogBootOptions);
exports.DogBootOptions = DogBootOptions;
//# sourceMappingURL=DogBootOptions.js.map