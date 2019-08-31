"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const koaBody = require("koa-body");
const koaStatic = require("koa-static");
const cors = require("koa2-cors");
const http = require("http");
const Component_1 = require("../core/Component");
const Utils_1 = require("../core/Utils");
const DogUtils_1 = require("../core/DogUtils");
const DIContainer_1 = require("../core/DIContainer");
const DogBootOptions_1 = require("./DogBootOptions");
const ActionFilterContext_1 = require("./ActionFilterContext");
const LazyResult_1 = require("./LazyResult");
const APIDocController_1 = require("./APIDocController");
const NotFoundException_1 = require("./NotFoundException");
const Area_1 = require("./Area");
class DogBootApplication {
    constructor() {
        this.app = new Koa();
        this.opts = Utils_1.Utils.getConfigValue(DogBootOptions_1.DogBootOptions)[0];
        this.container = new DIContainer_1.DIContainer();
        this.container.on('reload', () => {
            this.reload();
        });
    }
    build() {
        let publicRootPath = path.join(Utils_1.Utils.getAppRootPath(), this.opts.staticRootPathName);
        this.app.use(koaStatic(publicRootPath));
        this.app.use(koaBody());
        if (this.opts.enableCors) {
            this.app.use(cors(this.opts.corsOptions));
        }
        let controllerRootPath = path.join(Utils_1.Utils.getExecRootPath(), this.opts.controllerRootPathName);
        this.area = new Area_1.Area(controllerRootPath, '/');
        this.checkControllerDir(this.area);
    }
    checkControllerDir(area) {
        let list = fs.readdirSync(area.dirPath);
        list.forEach(a => {
            let filePath = path.join(area.dirPath, a);
            let fileState = fs.statSync(filePath);
            if (fileState.isFile()) {
                let _Module = Utils_1.Utils.tryRequire(filePath);
                _Module && Object.values(_Module).filter(b => b instanceof Function && b.prototype.$isController)
                    .forEach((b) => {
                    area.controllerList.push(b);
                    this.checkControllerClass(area.areaPath, b);
                });
            }
            else if (fileState.isDirectory()) {
                let areaPath = (area.areaPath + '/' + a).replace(/^\/\//, '/');
                let subArea = new Area_1.Area(filePath, areaPath);
                area.subAreaList.push(subArea);
                this.checkControllerDir(subArea);
            }
        });
    }
    checkControllerClass(areaPath, _Class) {
        let router = new Router({
            prefix: this.opts.prefix + (areaPath == '/' ? '' : areaPath) + _Class.prototype.$path
        });
        Object.getOwnPropertyNames(_Class.prototype).forEach(a => {
            this.checkAndHandleActionName(a, _Class, router, areaPath);
        });
        this.app.use(router.routes());
    }
    checkAndHandleActionName(actionName, _Class, router, areaPath) {
        let _prototype = _Class.prototype;
        let action = _prototype[actionName];
        if (!action.$method) {
            return;
        }
        router[action.$method](action.$path, (ctx) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.handleContext(actionName, _Class, ctx);
            }
            catch (err) {
                let filtersOnController = _prototype.$exceptionFilters || [];
                let filtersOnAction = _prototype[actionName].$exceptionFilters || [];
                let filters = this.globalExceptionFilters.concat(filtersOnController, filtersOnAction).reverse();
                let [exceptionFilter, handlerName] = this.getExceptionHandlerName(err.__proto__.constructor, areaPath, filters);
                if (!handlerName) {
                    [exceptionFilter, handlerName] = this.getExceptionHandlerName(Error, areaPath, filters);
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
            let $params = instance[actionName].$params || []; //使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
            let $paramTypes = instance[actionName].$paramTypes || []; //全部的参数类型
            let params = $params.map((b, idx) => {
                let originalValArr = b(ctx);
                let originalVal = originalValArr[0];
                let typeSpecified = originalValArr[1];
                let toType = $paramTypes[idx];
                if (typeSpecified && toType) {
                    return DogUtils_1.DogUtils.getTypeSpecifiedValue(toType, originalVal);
                }
                else {
                    return originalVal;
                }
            });
            for (let b of params) {
                Utils_1.Utils.validateModel(b);
            }
            let actionFilterContext = new ActionFilterContext_1.ActionFilterContext(ctx, params, $paramTypes, _Class, actionName);
            let filtersOnController = _prototype.$actionFilters || [];
            let filtersOnAction = instance[actionName].$actionFilters || [];
            let filters = this.globalActionFilters.concat(filtersOnController, filtersOnAction);
            let filterAndInstances = [];
            for (let filter of filters) {
                let filterInstance = yield this.container.getComponentInstanceFromFactory(filter);
                filterAndInstances.push([filter, filterInstance]);
                let handlerName = filter.prototype.$actionHandlerMap.get(Component_1.DoBefore);
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
                let handlerName = filter.prototype.$actionHandlerMap.get(Component_1.DoAfter);
                if (!handlerName) {
                    continue;
                }
                yield filterInstance[handlerName](actionFilterContext);
            }
        });
    }
    getExceptionHandlerName(exceptionType, area, filters) {
        for (let a of filters) {
            if (a.prototype.$isGlobalExceptionFilter && !area.startsWith(a.prototype.$area)) {
                continue;
            }
            let handlerName = a.prototype.$exceptionHandlerMap.get(exceptionType);
            if (handlerName) {
                return [a, handlerName];
            }
        }
        return [];
    }
    handlerException(exceptionFilter, handlerName, err, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            let exceptionFilterInstance = yield this.container.getComponentInstanceFromFactory(exceptionFilter);
            yield exceptionFilterInstance[handlerName](ctx, err);
        });
    }
    startUp() {
        return __awaiter(this, void 0, void 0, function* () {
            let startupRootPath = path.join(Utils_1.Utils.getExecRootPath(), this.opts.startupRootPathName);
            if (!fs.existsSync(startupRootPath)) {
                return;
            }
            let startUpFileList = Utils_1.Utils.getAllFileListInDir(startupRootPath);
            let startUpClassList = [];
            for (let filePath of startUpFileList) {
                let _Module = Utils_1.Utils.tryRequire(filePath);
                _Module && Object.values(_Module).forEach(a => {
                    if (a instanceof Function) {
                        startUpClassList.push(a);
                    }
                });
            }
            startUpClassList = startUpClassList.filter(a => a.prototype.$isStartUp).sort((a, b) => b.prototype.$order - a.prototype.$order);
            for (let startUp of startUpClassList) {
                yield this.container.getComponentInstanceFromFactory(startUp);
            }
        });
    }
    initControllers(area) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let controllerClass of area.controllerList) {
                yield this.container.getComponentInstanceFromFactory(controllerClass);
            }
            for (let subArea of area.subAreaList) {
                yield this.initControllers(subArea);
            }
        });
    }
    initFilters() {
        return __awaiter(this, void 0, void 0, function* () {
            let filterRootPath = path.join(Utils_1.Utils.getExecRootPath(), this.opts.filterRootPathName);
            if (!fs.existsSync(filterRootPath)) {
                return;
            }
            let filterFileList = Utils_1.Utils.getAllFileListInDir(filterRootPath);
            let filterClassList = [];
            for (let filePath of filterFileList) {
                let _Module = Utils_1.Utils.tryRequire(filePath);
                _Module && Object.values(_Module).forEach(a => {
                    if (a instanceof Function) {
                        filterClassList.push(a);
                    }
                });
            }
            this.globalActionFilters = filterClassList.filter(a => a.prototype.$isGlobalActionFilter).sort((a, b) => b.prototype.$order - a.prototype.$order);
            this.globalExceptionFilters = filterClassList.filter(a => a.prototype.$isGlobalExceptionFilter);
            for (let filter of this.globalActionFilters) {
                yield this.container.getComponentInstanceFromFactory(filter);
            }
            for (let filter of this.globalExceptionFilters) {
                yield this.container.getComponentInstanceFromFactory(filter);
            }
        });
    }
    buildApidoc() {
        if (!this.opts.enableApidoc) {
            return;
        }
        this.checkControllerClass('', APIDocController_1.APIDocController);
    }
    useNotFoundExceptionHandler() {
        this.app.use((ctx) => __awaiter(this, void 0, void 0, function* () {
            let [exceptionFilter, handlerName] = this.getExceptionHandlerName(NotFoundException_1.NotFoundException, '/', this.globalExceptionFilters);
            if (!handlerName) {
                return;
            }
            yield this.handlerException(exceptionFilter, handlerName, new NotFoundException_1.NotFoundException(), ctx);
        }));
    }
    /**
     * 主动热更新程序
     */
    reload() {
        this.container.clear();
        return this.runAsync();
    }
    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    runAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let startTime = Date.now();
            this.globalExceptionFilters = [];
            this.globalActionFilters = [];
            this.requestHandler = null;
            this.container.setComponentInstance(DogBootApplication, this);
            this.container.setComponentInstance(DIContainer_1.DIContainer, this.container);
            this.app.middleware = [];
            this.build();
            this.buildApidoc();
            this.useNotFoundExceptionHandler();
            this.requestHandler = this.app.callback();
            let port = this.opts.port;
            if (process.env.dogPort) {
                port = Number.parseInt(process.env.dogPort);
            }
            let lastServer = this.server;
            if (!lastServer) {
                this.server = http.createServer((req, res) => {
                    this.requestHandler(req, res);
                });
            }
            else {
                this.server.close();
            }
            yield this.startUp();
            yield this.initControllers(this.area);
            yield this.initFilters();
            this.server.listen(port);
            let endTime = Date.now();
            console.log(`Your application has ${lastServer ? 'reloaded' : 'started'} at ${port} in ${endTime - startTime}ms`);
            yield this.test();
            return this;
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.opts.enableTest) {
                return;
            }
            console.log('Running tests...');
            let startTime = Date.now();
            let testRootPath = path.join(Utils_1.Utils.getExecRootPath(), this.opts.testRootPathName);
            let testFileList = Utils_1.Utils.getAllFileListInDir(testRootPath);
            let testClassList = [];
            for (let testFile of testFileList) {
                try {
                    let _Module = Utils_1.Utils.tryRequire(testFile);
                    _Module && Object.values(_Module).filter(b => b instanceof Function && b.prototype.$isTest)
                        .forEach((b) => {
                        testClassList.push(b);
                    });
                }
                catch (error) { }
            }
            let passed = 0;
            let faild = 0;
            let total = 0;
            for (let _Class of testClassList) {
                let _prototype = _Class.prototype;
                let testInstance = yield this.container.getComponentInstanceFromFactory(_Class);
                for (let testMethod of _prototype.$testMethods) {
                    try {
                        yield testInstance[testMethod]();
                        passed += 1;
                    }
                    catch (error) {
                        console.error(`Test faild at ${_Class.name}.${testMethod}`);
                        console.trace(error.stack);
                        faild += 1;
                    }
                    finally {
                        total += 1;
                    }
                }
            }
            let endTime = Date.now();
            console.log(`All tests ran in ${endTime - startTime}ms`);
            console.table([{ passed, faild, total }]);
        });
    }
}
exports.DogBootApplication = DogBootApplication;
//# sourceMappingURL=DogBootApplication.js.map