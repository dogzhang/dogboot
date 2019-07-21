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
const chokidar = require("chokidar");
const events_1 = require("events");
const Utils_1 = require("./Utils");
const DogUtils_1 = require("./DogUtils");
const DIContainerOptions_1 = require("./DIContainerOptions");
class DIContainer extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.componentInstanceMapKeyByFilenameAndClassName = new Map();
        this.componentInstanceMap = new Map();
        this.configPathSet = new Set();
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.componentInstanceMap.set(DIContainer, this);
            this.opts = yield this.getComponentInstanceFromFactory(DIContainerOptions_1.DIContainerOptions);
            if (this.opts.enableHotload == true) {
                this.watch();
            }
        });
    }
    watch() {
        return __awaiter(this, void 0, void 0, function* () {
            this.watcher = chokidar.watch([Utils_1.Utils.getExecRootPath()], {
                ignoreInitial: true,
                ignorePermissionErrors: true
            });
            let st;
            this.watcher.on('all', () => {
                clearTimeout(st);
                st = setTimeout(() => {
                    this.reload();
                }, this.opts.hotloadDebounceInterval);
            });
        });
    }
    reload() {
        Utils_1.Utils.getFileListInFolder(Utils_1.Utils.getExecRootPath()).forEach(a => {
            if (require.cache[a]) {
                delete require.cache[a];
            }
        });
        this.configPathSet.forEach(a => {
            delete require.cache[a];
        });
        this.configPathSet.clear();
        this.componentInstanceMap.clear();
        this.emit('reload');
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
     * 以同步的方式根据指定类型从容器取出实例
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
            if (!target.prototype.$isComponent) {
                throw new Error(`${target.name}没有被注册为可自动解析的组件，请至少添加@Component、@StartUp、@Controller、@Config等装饰器中的一种`);
            }
            let map = this.componentInstanceMapKeyByFilenameAndClassName.get(target.prototype.$filename) || new Map();
            let lastInstance = map.get(target.name);
            let instance = null;
            if (target.prototype.$isConfig) {
                instance = this.getConfigValue(target);
                this.componentInstanceMap.set(target, instance);
            }
            else {
                instance = Reflect.construct(target, yield this.getParamInstances(target));
                this.componentInstanceMap.set(target, instance);
                yield this.resolveAutowiredDependences(instance);
                if (lastInstance) {
                    if (target.prototype.$aliveFields) {
                        target.prototype.$aliveFields.forEach((a) => {
                            if (lastInstance.hasOwnProperty(a)) {
                                instance[a] = lastInstance[a];
                            }
                        });
                    }
                }
                let initMethod = target.prototype.$initMethod;
                if (initMethod) {
                    yield instance[initMethod](lastInstance);
                }
            }
            map.set(target.name, instance);
            this.componentInstanceMapKeyByFilenameAndClassName.set(target.prototype.$filename, map);
            return instance;
        });
    }
    getParamInstances(target) {
        return __awaiter(this, void 0, void 0, function* () {
            let paramTypes = target.prototype.$paramTypes;
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
            let autowiredMap = target.prototype.$autowiredMap;
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
    getConfigValue(target) {
        let configName = target.prototype.$configName;
        let configFilePath = Utils_1.Utils.getConfigFilename(configName);
        let originalVal = null;
        try {
            originalVal = require(configFilePath);
            this.addConfigFilePath(configFilePath);
        }
        catch (_a) { }
        let sectionArr = target.prototype.$configField.split('.').filter((a) => a);
        for (let a of sectionArr) {
            if (originalVal == null) {
                break;
            }
            originalVal = originalVal[a];
        }
        return DogUtils_1.DogUtils.getTypeSpecifiedValue(target, originalVal, new target());
    }
    addConfigFilePath(configFilePath) {
        if (!this.opts) {
            return;
        }
        if (!this.opts.enableHotload) {
            return;
        }
        if (this.configPathSet.has(configFilePath)) {
            return;
        }
        this.configPathSet.add(configFilePath);
        this.watcher.add(configFilePath);
    }
}
exports.DIContainer = DIContainer;
//# sourceMappingURL=DIContainer.js.map