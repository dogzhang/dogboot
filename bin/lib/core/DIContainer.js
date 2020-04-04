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
const InnerCache_1 = require("./InnerCache");
const Utils_1 = require("./Utils");
class DIContainer {
    constructor() {
        this.componentSet = new Set();
        this.componentInstanceMap = new Map();
        this.startTime = Date.now();
        this.setComponentInstance(DIContainer, this);
    }
    /**
     * 将已经实例化好的对象添加进容器
     * @param target 类型
     * @param instance 实例
     */
    setComponentInstance(target, instance) {
        this.componentInstanceMap.set(target, instance);
    }
    /**
     * 以同步的方式根据指定类型从容器取出实例，需要确保此时类实例已经存在
     * @param target 类型
     */
    getComponentInstance(target) {
        return this.componentInstanceMap.get(target);
    }
    /**
     * 从工厂获取指定类型的组件实例，如果此组件类型没有一个可用实例，会创建一个实例然后返回给调用者
     * 这是一个异步方法，不能在构造器中起作用，所以请仅仅在程序启动的时候使用此方法
     * 程序运行中获取实例应该使用同步方法getComponentInstance
     * @param target 组件类型
     */
    getComponentInstanceFromFactory(target) {
        return __awaiter(this, void 0, void 0, function* () {
            let instance = this.componentInstanceMap.get(target);
            if (instance) {
                return yield instance;
            }
            let instancePromise = this.createComponentInstance(target);
            this.componentInstanceMap.set(target, instancePromise);
            return instancePromise;
        });
    }
    createComponentInstance(target) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Reflect.getMetadata('$isComponent', target.prototype)) {
                throw new Error(`${target.name}没有被注册为可自动解析的组件，请至少添加@Component、@StartUp、@Controller、@Config等装饰器中的一种`);
            }
            try {
                let instance = null;
                if (Reflect.getMetadata('$isConfig', target.prototype)) {
                    instance = Utils_1.Utils.getConfigValue(target);
                    this.componentInstanceMap.set(target, instance);
                }
                else {
                    instance = Reflect.construct(target, yield this.getParamInstances(target));
                    this.componentInstanceMap.set(target, instance);
                    yield this.resolveAutowiredDependences(instance);
                    let initMethod = Reflect.getMetadata('$initMethod', target.prototype);
                    if (initMethod) {
                        yield instance[initMethod]();
                    }
                }
                return instance;
            }
            catch (error) {
                console.error(`初始化${target.name}时发生错误`);
                throw error;
            }
        });
    }
    getParamInstances(target) {
        return __awaiter(this, void 0, void 0, function* () {
            let paramTypes = Reflect.getMetadata('$paramTypes', target.prototype);
            let paramInstances = [];
            for (let paramType of paramTypes) {
                let paramInstance = yield this.getComponentInstanceFromFactory(paramType);
                paramInstances.push(paramInstance);
            }
            return paramInstances;
        });
    }
    resolveAutowiredDependences(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            let target = instance.__proto__.constructor;
            let autowiredMap = Reflect.getMetadata('$autowiredMap', target.prototype);
            if (autowiredMap) {
                for (let [k, v] of autowiredMap) {
                    if (v.name) {
                        instance[k] = yield this.getComponentInstanceFromFactory(v);
                    }
                    else {
                        let _Class = v();
                        instance[k] = yield this.getComponentInstanceFromFactory(_Class);
                    }
                }
            }
        });
    }
    loadClass(_class) {
        if (Reflect.getMetadata('$isComponent', _class.prototype)) {
            this.componentSet.add(_class);
        }
        return this;
    }
    loadModule(_Module) {
        Object.values(_Module).filter(a => a instanceof Function)
            .forEach((a) => {
            this.loadClass(a);
        });
        return this;
    }
    loadFile(filename) {
        if (require.cache[filename]) {
            return;
        }
        let _Module = Utils_1.Utils.tryRequire(filename);
        if (_Module == null) {
            return;
        }
        this.loadModule(_Module);
        return this;
    }
    loadDir(dir) {
        let files = Utils_1.Utils.getAllFileListInDir(dir);
        files.forEach(a => this.loadFile(a));
        return this;
    }
    getComponentsByTag(tag) {
        return Array.from(this.componentSet).filter(a => Reflect.getMetadata(tag, a.prototype));
    }
    initStartUps() {
        return __awaiter(this, void 0, void 0, function* () {
            let startUpClassList = this.getComponentsByTag('$isStartUp').sort((a, b) => Reflect.getMetadata('$order', b.prototype) - Reflect.getMetadata('$order', a.prototype));
            for (let startUp of startUpClassList) {
                yield this.getComponentInstanceFromFactory(startUp);
            }
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.argv.includes('-t') == false) {
                return;
            }
            let testClassList = this.getComponentsByTag('$isTest');
            if (testClassList.length == 0) {
                return;
            }
            let onlyList = testClassList.filter(a => Reflect.getMetadata('$only', a.prototype) == true);
            if (onlyList.length > 0) {
                testClassList = onlyList;
            }
            console.log('Running tests...');
            let startTime = Date.now();
            let failCount = 0;
            let results = [];
            for (let _Class of testClassList) {
                let _prototype = _Class.prototype;
                let testInstance = yield this.getComponentInstanceFromFactory(_Class);
                let testMethods = Reflect.getMetadata('$testMethods', _prototype);
                if (!testMethods || testMethods.length == 0) {
                    continue;
                }
                let onlyMethods = testMethods.filter(a => Reflect.getMetadata('$only', _prototype, a) == true);
                if (onlyMethods.length > 0) {
                    testMethods = onlyMethods;
                }
                for (let testMethod of testMethods) {
                    let result = {
                        name: _Class.name + '/' + testMethod,
                        passed: false
                    };
                    let startTime = Date.now();
                    try {
                        yield testInstance[testMethod]();
                        result.passed = true;
                    }
                    catch (error) {
                        result.passed = false;
                        result.error = error;
                        failCount += 1;
                    }
                    finally {
                        let endTime = Date.now();
                        let ts = endTime - startTime;
                        result.period = ts;
                        results.push(result);
                    }
                }
            }
            let endTime = Date.now();
            results.forEach(a => {
                console.log(`%c${a.passed ? 'PASS' : 'FAIL'}`, ` ${a.passed ? 'background: #00ff00;' : 'background: #ff0000; color: #fff'};`, `${a.name} in ${a.period}ms`);
                if (a.error) {
                    console.error(a.error.stack);
                }
            });
            console.log(`All tests ran in ${endTime - startTime}ms, total: ${results.length}, pass: ${results.length - failCount}, ${failCount > 0 ? '%c' : ''}fail: ${failCount}`, ...(failCount > 0 ? ['background: #ff0000; color: #fff'] : ''));
        });
    }
    runAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.loadDir(Utils_1.Utils.getExecRootPath());
            yield this.initStartUps();
            yield this.test();
            return this;
        });
    }
}
__decorate([
    InnerCache_1.InnerCachable({ keys: [[0, '']] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DIContainer.prototype, "getComponentsByTag", null);
exports.DIContainer = DIContainer;
let _instance;
function getContainer() {
    if (_instance == null) {
        _instance = new DIContainer();
    }
    return _instance;
}
exports.getContainer = getContainer;
//# sourceMappingURL=DIContainer.js.map