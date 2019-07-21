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
const TypeConvert_1 = require("./TypeConvert");
/**
 * 跨域选项，dogboot使用koa2-cors这个包实现跨域，参见https://github.com/zadzbw/koa2-cors
 */
class CorsOptions {
}
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", String)
], CorsOptions.prototype, "origin", void 0);
__decorate([
    TypeConvert_1.TypedArray(String),
    __metadata("design:type", Array)
], CorsOptions.prototype, "exposeHeaders", void 0);
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", Number)
], CorsOptions.prototype, "maxAge", void 0);
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", Boolean)
], CorsOptions.prototype, "credentials", void 0);
__decorate([
    TypeConvert_1.TypedArray(String),
    __metadata("design:type", Array)
], CorsOptions.prototype, "allowMethods", void 0);
__decorate([
    TypeConvert_1.TypedArray(String),
    __metadata("design:type", Array)
], CorsOptions.prototype, "allowHeaders", void 0);
exports.CorsOptions = CorsOptions;
//# sourceMappingURL=CorsOptions.js.map