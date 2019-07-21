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
const Mapping_1 = require("./Mapping");
const DogBootApplication_1 = require("./DogBootApplication");
let APIDocController = class APIDocController {
    index() {
        return '/apidoc';
    }
    action() {
        return '/apidoc/action';
    }
};
__decorate([
    Component_1.Autowired(() => DogBootApplication_1.DogBootApplication),
    __metadata("design:type", DogBootApplication_1.DogBootApplication)
], APIDocController.prototype, "app", void 0);
__decorate([
    Mapping_1.GetMapping(''),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], APIDocController.prototype, "index", null);
__decorate([
    Mapping_1.GetMapping(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], APIDocController.prototype, "action", null);
APIDocController = __decorate([
    Component_1.Controller()
], APIDocController);
exports.APIDocController = APIDocController;
//# sourceMappingURL=APIDocController.js.map