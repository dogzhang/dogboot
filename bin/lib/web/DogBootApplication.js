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
const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const koaBody = require("koa-body");
const koaStatic = require("koa-static");
const cors = require("koa2-cors");
const core_1 = require("../core");
const ActionFilterContext_1 = require("./ActionFilterContext");
const APIDocController_1 = require("./APIDocController");
const DogBootOptions_1 = require("./DogBootOptions");
const LazyResult_1 = require("./LazyResult");
const NotFoundException_1 = require("./NotFoundException");
let DogBootApplication = class DogBootApplication {
    constructor(opts, container) {
        this.opts = opts;
        this.container = container;
        this.app = new Koa();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.build();
            this.buildApidoc();
            this.useNotFoundExceptionHandler();
            let port = this.opts.port;
            if (process.env.dogPort) {
                port = Number.parseInt(process.env.dogPort);
            }
            this.server = this.app.listen(port);
            yield this.initControllers();
            yield this.initFilters();
            let endTime = Date.now();
            console.log(`Your application has started at ${port} in ${endTime - this.container.startTime}ms`);
            return this;
        });
    }
    build() {
        let publicRootPath = path.join(core_1.Utils.getAppRootPath(), 'public');
        this.app.use(koaStatic(publicRootPath));
        this.app.use(koaBody());
        if (this.opts.enableCors) {
            this.app.use(cors(this.opts.corsOptions));
        }
        let controllerList = this.container.getComponentsByTag('$isController');
        for (let controllerClass of controllerList) {
            this.checkControllerClass(controllerClass);
        }
    }
    checkControllerClass(_Class) {
        let router = new Router({
            prefix: this.opts.prefix + Reflect.getMetadata('$path', _Class.prototype)
        });
        Object.getOwnPropertyNames(_Class.prototype).forEach(a => {
            this.checkAndHandleActionName(a, _Class, router);
        });
        this.app.use(router.routes());
    }
    checkAndHandleActionName(actionName, _Class, router) {
        let _prototype = _Class.prototype;
        let $method = Reflect.getMetadata('$method', _prototype, actionName);
        let $path = Reflect.getMetadata('$path', _prototype, actionName);
        if (!$method) {
            return;
        }
        router[$method]($path, (ctx) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.handleContext(actionName, _Class, ctx);
            }
            catch (err) {
                let filtersOnController = Reflect.getMetadata('$exceptionFilters', _prototype) || [];
                let filtersOnAction = Reflect.getMetadata('$exceptionFilters', _prototype, actionName) || [];
                let filters = this.container.getComponentsByTag('$isGlobalExceptionFilter').concat(filtersOnController, filtersOnAction).reverse();
                let [exceptionFilter, handlerName] = this.getExceptionHandlerName(err.constructor, ctx.path, filters);
                if (!handlerName) {
                    [exceptionFilter, handlerName] = this.getExceptionHandlerName(Error, ctx.path, filters);
                }
                if (!handlerName) {
                    throw err;
                }
                yield this.handlerException(exceptionFilter, handlerName, err, ctx);
            }
        }));
    }
    handleContext(actionName, _Class, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            let _prototype = _Class.prototype;
            let instance = yield this.container.getComponentInstanceFromFactory(_prototype.constructor);
            let $params = Reflect.getMetadata('$params', _prototype, actionName) || []; //使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
            let $paramTypes = Reflect.getMetadata('design:paramtypes', _prototype, actionName) || []; //全部的参数类型
            let params = $params.map((b, idx) => {
                let originalValArr = b(ctx);
                let originalVal = originalValArr[0];
                let typeSpecified = originalValArr[1];
                let toType = $paramTypes[idx];
                if (typeSpecified && toType) {
                    return core_1.Utils.getTypeSpecifiedValue(toType, originalVal);
                }
                else {
                    return originalVal;
                }
            });
            for (let b of params) {
                core_1.Utils.validateModel(b);
            }
            let actionFilterContext = new ActionFilterContext_1.ActionFilterContext(ctx, params, $paramTypes, _Class, actionName);
            let filtersOnController = Reflect.getMetadata('$actionFilters', _prototype) || [];
            let filtersOnAction = Reflect.getMetadata('$actionFilters', _prototype, actionName) || [];
            let globalActionFilters = this.getGlobalActionFiltersOfThisPath(ctx.path);
            let filters = globalActionFilters.concat(filtersOnController, filtersOnAction);
            let filterAndInstances = [];
            for (let filter of filters) {
                let filterInstance = yield this.container.getComponentInstanceFromFactory(filter);
                filterAndInstances.push([filter, filterInstance]);
                let handlerName = Reflect.getMetadata('$actionHandlerMap', filter.prototype).get(core_1.DoBefore);
                if (!handlerName) {
                    continue;
                }
                yield filterInstance[handlerName](actionFilterContext);
                if (ctx.status != 404) {
                    break;
                }
            }
            if (ctx.status == 404) {
                let body = yield instance[actionName](...params);
                if (ctx.status == 404) {
                    if (body instanceof LazyResult_1.LazyResult) {
                        ctx.state.LazyResult = body;
                    }
                    else {
                        ctx.body = body;
                    }
                }
            }
            for (let [filter, filterInstance] of filterAndInstances.reverse()) {
                let handlerName = Reflect.getMetadata('$actionHandlerMap', filter.prototype).get(core_1.DoAfter);
                if (!handlerName) {
                    continue;
                }
                yield filterInstance[handlerName](actionFilterContext);
            }
        });
    }
    getGlobalActionFiltersOfThisPath(path) {
        let globalActionFilters = this.container.getComponentsByTag('$isGlobalActionFilter');
        return globalActionFilters.filter(a => this.isThisPathInScope(path, Reflect.getMetadata('$scope', a.prototype)));
    }
    getExceptionHandlerName(exceptionType, path, filters) {
        for (let a of filters) {
            if (Reflect.getMetadata('$isGlobalExceptionFilter', a.prototype)) {
                let $scope = Reflect.getMetadata('$scope', a.prototype);
                if (!this.isThisPathInScope(path, $scope)) {
                    continue;
                }
            }
            let handlerName = Reflect.getMetadata('$exceptionHandlerMap', a.prototype).get(exceptionType);
            if (handlerName) {
                return [a, handlerName];
            }
        }
        return [];
    }
    isThisPathInScope(path, $scope) {
        let $scopeArr = $scope.split('/').filter(b => b);
        let pathArr = path.split('/').filter(b => b);
        if ($scopeArr.some((b, i) => pathArr[i] != b)) {
            return false;
        }
        return true;
    }
    handlerException(exceptionFilter, handlerName, err, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            let exceptionFilterInstance = yield this.container.getComponentInstanceFromFactory(exceptionFilter);
            yield exceptionFilterInstance[handlerName](ctx, err);
        });
    }
    initControllers() {
        return __awaiter(this, void 0, void 0, function* () {
            let controllerList = this.container.getComponentsByTag('$isController');
            for (let controllerClass of controllerList) {
                yield this.container.getComponentInstanceFromFactory(controllerClass);
            }
        });
    }
    initFilters() {
        return __awaiter(this, void 0, void 0, function* () {
            let globalActionFilters = this.container.getComponentsByTag('$isGlobalActionFilter').sort((a, b) => Reflect.getMetadata('$order', b.prototype) - Reflect.getMetadata('$order', a.prototype));
            let globalExceptionFilters = this.container.getComponentsByTag('$isGlobalExceptionFilter');
            for (let filter of globalActionFilters) {
                yield this.container.getComponentInstanceFromFactory(filter);
            }
            for (let filter of globalExceptionFilters) {
                yield this.container.getComponentInstanceFromFactory(filter);
            }
        });
    }
    buildApidoc() {
        if (!this.opts.enableApidoc) {
            return;
        }
        this.checkControllerClass(APIDocController_1.APIDocController);
    }
    useNotFoundExceptionHandler() {
        this.app.use((ctx) => __awaiter(this, void 0, void 0, function* () {
            let globalExceptionFilters = this.container.getComponentsByTag('$isGlobalExceptionFilter');
            let [exceptionFilter, handlerName] = this.getExceptionHandlerName(NotFoundException_1.NotFoundException, '/', globalExceptionFilters);
            if (!handlerName) {
                return;
            }
            yield this.handlerException(exceptionFilter, handlerName, new NotFoundException_1.NotFoundException(), ctx);
        }));
    }
};
__decorate([
    core_1.Init,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DogBootApplication.prototype, "init", null);
__decorate([
    core_1.InnerCachable({ keys: [[0, '']] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DogBootApplication.prototype, "getGlobalActionFiltersOfThisPath", null);
__decorate([
    core_1.InnerCachable({ keys: [[0, ''], [1, '']] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DogBootApplication.prototype, "isThisPathInScope", null);
DogBootApplication = __decorate([
    core_1.StartUp(),
    __metadata("design:paramtypes", [DogBootOptions_1.DogBootOptions,
        core_1.DIContainer])
], DogBootApplication);
exports.DogBootApplication = DogBootApplication;
//# sourceMappingURL=DogBootApplication.js.map