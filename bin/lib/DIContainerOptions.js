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
const Component_1 = require("./Component");
const TypeConvert_1 = require("./TypeConvert");
let DIContainerOptions = class DIContainerOptions {
    constructor() {
        this.enableHotload = false;
        /**
         * 热更新监听文件变化的debounce，单位：毫秒，默认1000
         */
        this.hotloadDebounceInterval = 1000;
    }
};
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", Boolean)
], DIContainerOptions.prototype, "enableHotload", void 0);
__decorate([
    TypeConvert_1.Typed(),
    __metadata("design:type", Number)
], DIContainerOptions.prototype, "hotloadDebounceInterval", void 0);
DIContainerOptions = __decorate([
    Component_1.Config({ field: 'app' })
], DIContainerOptions);
exports.DIContainerOptions = DIContainerOptions;
//# sourceMappingURL=DIContainerOptions.js.map