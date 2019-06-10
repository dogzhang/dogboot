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
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var DogBootApplication_1;
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
let { Module } = require("module");
const Koa = require("koa");
const Router = require("koa-router");
const koaBody = require("koa-body");
const koaStatic = require("koa-static");
const cors = require("koa2-cors");
const http = require("http");
require("reflect-metadata");
let oldLoadFunc = Module.prototype.load;
Module.prototype.load = function (filename) {
    oldLoadFunc.call(this, filename);
    try {
        for (let p in this.exports) {
            let field = this.exports[p];
            if (field.prototype.$isComponent) {
                field.prototype.$filename = filename;
            }
        }
    }
    catch (_a) { }
};
class DIContainer {
    constructor(opts) {
        this.componentInstanceMapKeyByFilenameAndClassName = new Map();
        this.configPathSet = new Set();
        this.refresh(opts);
    }
    refresh(opts) {
        this.opts = Object.assign({}, opts);
        if (this.opts.hotloadDebounceInterval == null) {
            this.opts.hotloadDebounceInterval = 100;
        }
        this.componentInstanceMap = new Map();
        if (this.watcher) {
            this.watcher.close();
        }
        if (this.opts.enableHotload == true) {
            this.watch();
        }
    }
    watch() {
        return __awaiter(this, void 0, void 0, function* () {
            this.watcher = chokidar.watch([Utils.getExecRootPath()], {
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
        Utils.getFileListInFolder(Utils.getExecRootPath()).forEach(a => {
            if (require.cache[a]) {
                delete require.cache[a];
            }
        });
        this.configPathSet.forEach(a => {
            delete require.cache[a];
        });
        this.configPathSet.clear();
        this.componentInstanceMap.clear();
        require(process.mainModule.filename);
    }
    /**
     * 设置组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * @param key 组件key，可以是任意值
     * @param instance 组件实例，可以是任意值
     */
    setComponentInstance(key, instance) {
        this.componentInstanceMap.set(key, instance);
    }
    /**
     * 根据key获取组件实例，实际上是从一个Map<any, any>获取数据，所以key、value可以自由设置以及获取
     * @param key 组件key，可以是任意值
     */
    getComponentInstance(key) {
        return this.componentInstanceMap.get(key);
    }
    /**
     * 从工厂获取指定类型的组件实例，如果此组件类型没有一个可用实例，会创建一个实例然后返回给调用者
     * 这是一个异步方法，不能在构造器中起作用，所以请仅仅在程序启动的时候使用此方法
     * 程序运行中获取实例应该使用同步方法getComponentInstance
     * @param target 组件类型
     */
    getComponentInstanceFromFactory(target) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!target.prototype.$isComponent) {
                throw new Error(`${target.name}没有被注册为可自动解析的组件，请至少添加@Component、@StartUp、@Controller、@Config等装饰器中的一种`);
            }
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
            let map = this.componentInstanceMapKeyByFilenameAndClassName.get(target.prototype.$filename) || new Map();
            let lastInstance = map.get(target.name);
            let instance = null;
            if (target.prototype.$isConfig) {
                instance = this.getConfigValue(target);
            }
            else {
                instance = Reflect.construct(target, yield this.getParamInstances(target));
                yield this.resolveAutowiredDependences(instance);
                if (lastInstance) {
                    if (target.prototype.$aliveFields) {
                        target.prototype.$aliveFields.forEach((a) => {
                            instance[a] = lastInstance[a];
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
            this.componentInstanceMap.set(target, instance);
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
        let configFilePath = Utils.getConfigFilename(configName);
        this.addConfigFilePath(configFilePath);
        let originalVal = require(configFilePath);
        let sectionArr = target.prototype.$configField.split('.').filter((a) => a);
        for (let a of sectionArr) {
            if (originalVal == null) {
                return null;
            }
            originalVal = originalVal[a];
        }
        if (originalVal == null) {
            return null;
        }
        return DogUtils.getTypeSpecifiedValue(target, originalVal);
    }
    addConfigFilePath(configFilePath) {
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
/**
 * 包含一些公开的实用工具方法
 */
class DogUtils {
    /**
     * 获取指定类型的对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValue(type, originalVal) {
        if (originalVal == null) {
            return null;
        }
        if (type == Number || type == String || type == Boolean) {
            return type(originalVal);
        }
        if (type == Date) {
            return new Date(originalVal);
        }
        let newVal = Reflect.construct(type, []);
        type.prototype.$fields && Object.entries(type.prototype.$fields).forEach(([k, v]) => {
            let typeSpecifiedMap = v;
            if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.General) {
                newVal[k] = this.getTypeSpecifiedValue(typeSpecifiedMap.type, originalVal[typeSpecifiedMap.sourceName]);
            }
            else if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.Array) {
                if (Array.isArray(originalVal[typeSpecifiedMap.sourceName])) {
                    newVal[k] = originalVal[typeSpecifiedMap.sourceName].map((a) => this.getTypeSpecifiedValue(typeSpecifiedMap.type, a));
                }
                else {
                    newVal[k] = null;
                }
            }
        });
        return newVal;
    }
    /**
     * 获取指定类型的数组对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValueArray(type, originalVal) {
        if (originalVal == null) {
            return null;
        }
        return originalVal.map(a => this.getTypeSpecifiedValue(type, a));
    }
}
exports.DogUtils = DogUtils;
/**
 * 仅仅被dogboot使用的内部工具方法
 */
class Utils {
    /**
     * 标记为组件
     * @param target 目标类型
     */
    static markAsComponent(target) {
        target.prototype.$isComponent = true;
        let paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
        if (paramTypes.includes(target)) {
            console.error(`${target.name}中存在自我依赖`);
            process.abort();
        }
        target.prototype.$paramTypes = paramTypes;
    }
    /**
     * 获取指定目录下js或者ts文件列表
     * @param dirPath 指定的目录
     */
    static getFileListInFolder(dirPath) {
        let list = fs.readdirSync(dirPath);
        let fileList = [];
        list.forEach(a => {
            let filePath = path.join(dirPath, a);
            let fileState = fs.statSync(filePath);
            if (fileState.isDirectory()) {
                fileList = fileList.concat(this.getFileListInFolder(filePath));
            }
            else {
                if ((filePath.endsWith('.ts') || filePath.endsWith('js')) && !filePath.endsWith('.d.ts')) {
                    fileList.push(filePath);
                }
            }
        });
        return fileList;
    }
    static getValidator(obj) {
        return obj != null && obj.__proto__ && obj.__proto__.$validator;
    }
    /**
     * 验证模型是否合法，第一个不合法的字段会导致此方法抛出异常IllegalArgumentException
     * @param model 待验证的模型对象
     */
    static validateModel(model) {
        let validator = this.getValidator(model);
        if (!validator) {
            return;
        }
        let entries = Object.entries(validator);
        for (let entrie of entries) {
            let k = entrie[0];
            let fieldVal = model[k];
            if (fieldVal instanceof Array) {
                for (let a of fieldVal) {
                    this.validateModel(a);
                }
            }
            else {
                this.validateModel(fieldVal);
            }
            let v = entrie[1];
            let funcList = v;
            for (let func of funcList) {
                func(fieldVal);
            }
        }
    }
    static sleep(milliseconds) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }
    static getAppRootPath() {
        return path.resolve(process.mainModule.filename, '..', '..');
    }
    static getExecRootPath() {
        if (process.mainModule.filename.endsWith('.ts')) {
            return path.join(this.getAppRootPath(), 'src');
        }
        else {
            return path.join(this.getAppRootPath(), 'bin');
        }
    }
    static getConfigFilename(configName) {
        return path.join(this.getAppRootPath(), configName);
    }
}
/**
 * 指定此类为组件，生命周期将完全交给dogboot管理
 * 所有组件将在程序启动的时候初始化完成，所有组件初始化完成后，程序才会开始接受http请求
 * @param target
 */
function Component(target) {
    Utils.markAsComponent(target);
}
exports.Component = Component;
/**
 * 指定此类为预启动组件，将在程序启动时预先启动。
 * 事实上，所有的组件只要被使用到都会在程序启动时预先启动，使用StartUp标记那些没有被其他组件使用的组件，确保此组件也能启动
 * StartUp是一种特殊的Component
 * @param order 优先级，值越大越优先启动
 */
function StartUp(order = 0) {
    return function (target) {
        target.prototype.$isStartUp = true;
        target.prototype.$order = order;
        Utils.markAsComponent(target);
    };
}
exports.StartUp = StartUp;
/**
 * 标记此类为全局请求过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 请求过滤器作用方式遵循洋葱模型，执行顺序为：
 *     1、低优先级ActionFilter.DoBefore
 *     2、高优先级ActionFilter.DoBefore
 *     3、Controller.Action
 *     4、高优先级ActionFilter.DoAfter
 *     5、低优先级ActionFilter.DoAfter
 * 任何一步导致ctx.status != 404都将阻止后续步骤的执行
 * ActionFilter是一种特殊的Component
 * @param order 优先级，值越大优先级越高
 */
function GlobalActionFilter(order = 0) {
    return function (target) {
        target.prototype.$isActionFilter = true;
        target.prototype.$order = order;
        Utils.markAsComponent(target);
    };
}
exports.GlobalActionFilter = GlobalActionFilter;
/**
 * 标记此类为局部请求过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，靠前的优先级更高
 * 配合UseActionFilter来使用
 */
function ActionFilter(target) {
    target.prototype.$isFreeActionFilter = true;
    Utils.markAsComponent(target);
}
exports.ActionFilter = ActionFilter;
/**
 * 标记此类为全局异常过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 注意，一个app只能有一个全局异常过滤器，请删除多余的全局异常过滤器，以免程序运行结果不符合预期
 * ExceptionFilter是一种特殊的Component
 */
function GlobalExceptionFilter(target) {
    target.prototype.$isExceptionFilter = true;
    Utils.markAsComponent(target);
}
exports.GlobalExceptionFilter = GlobalExceptionFilter;
/**
 * 标记此类为局部异常过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，只会使用第一个
 * 配合UseExceptionFilter来使用
 */
function ExceptionFilter(target) {
    target.prototype.$isFreeExceptionFilter = true;
    Utils.markAsComponent(target);
}
exports.ExceptionFilter = ExceptionFilter;
/**
 * 表示一个配置文件映射器
 * Config是一种特殊的Component
 * @param field 需要映射的节
 */
function Config(opts) {
    return function (target) {
        opts = opts || {};
        target.prototype.$isConfig = true;
        target.prototype.$configField = opts.field || '';
        target.prototype.$configName = opts.name || 'config.json';
        Utils.markAsComponent(target);
    };
}
exports.Config = Config;
/**
 * 通过属性注入依赖的组件
 * @param type
 */
function Autowired(type) {
    return function (target, name) {
        if (!type) {
            console.error(`${target.constructor.name}中存在不正确的循环依赖${name}，请使用@Autowired(() => type of ${name})注入此依赖项`);
            process.abort();
        }
        target.$autowiredMap = target.$autowiredMap || new Map();
        target.$autowiredMap.set(name, type);
    };
}
exports.Autowired = Autowired;
/**
 * 指定此字段需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
function Typed(sourceNameOrGetSourceNameFunc = null) {
    return function (target, name) {
        target.$fields = target.$fields || {};
        target.$fields[name] = new TypeSpecifiedMap(TypeSpecifiedType.General, Reflect.getMetadata('design:type', target, name), getSourceName(name, sourceNameOrGetSourceNameFunc));
    };
}
exports.Typed = Typed;
/**
 * 指定此Array字段的确切类型需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
function TypedArray(type, sourceNameOrGetSourceNameFunc = null) {
    return function (target, name) {
        target.$fields = target.$fields || {};
        target.$fields[name] = new TypeSpecifiedMap(TypeSpecifiedType.Array, type, getSourceName(name, sourceNameOrGetSourceNameFunc));
    };
}
exports.TypedArray = TypedArray;
function getSourceName(targetName, sourceNameOrGetSourceNameFunc = null) {
    if (!sourceNameOrGetSourceNameFunc) {
        return targetName;
    }
    if (typeof sourceNameOrGetSourceNameFunc == 'string') {
        return sourceNameOrGetSourceNameFunc;
    }
    return sourceNameOrGetSourceNameFunc(targetName);
}
var TypeSpecifiedType;
(function (TypeSpecifiedType) {
    TypeSpecifiedType[TypeSpecifiedType["General"] = 0] = "General";
    TypeSpecifiedType[TypeSpecifiedType["Array"] = 1] = "Array";
})(TypeSpecifiedType || (TypeSpecifiedType = {}));
class TypeSpecifiedMap {
    constructor(typeSpecifiedType, type, sourceName) {
        this.typeSpecifiedType = typeSpecifiedType;
        this.type = type;
        this.sourceName = sourceName;
    }
}
/**
 * 指定此Array类型需要验证其确切类型
 */
function Valid(target, name) {
    target.$validator = target.$validator || {};
    target.$validator[name] = target.$validator[name] || [];
}
exports.Valid = Valid;
/**
 * 用于自定义自己的验证器，所有dogboot内置验证器也是基于此来实现
 * @param func 验证规则
 */
function Func(func) {
    return function (target, name) {
        target.$validator = target.$validator || {};
        target.$validator[name] = target.$validator[name] || [];
        target.$validator[name].push((a) => __awaiter(this, void 0, void 0, function* () {
            let result = yield func(a);
            if (!result[0]) {
                throw new IllegalArgumentException(result[1], target.constructor.name, name);
            }
        }));
    };
}
exports.Func = Func;
/**
 * a != null
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
function NotNull(errorMesage = null) {
    errorMesage = errorMesage || '字段不能为空';
    return Func(a => {
        if (a != null) {
            return [true];
        }
        return [false, errorMesage];
    });
}
exports.NotNull = NotNull;
/**
 * a != null && a.length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
function NotEmpty(errorMesage = null) {
    errorMesage = errorMesage || '字段不能为空';
    return Func(a => {
        if (a != null && a.length > 0) {
            return [true];
        }
        return [false, errorMesage];
    });
}
exports.NotEmpty = NotEmpty;
/**
 * a != null && a.trim().length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
function NotBlank(errorMesage = null) {
    errorMesage = errorMesage || '字段不能为空';
    return Func(a => {
        if (a != null && a.trim().length > 0) {
            return [true];
        }
        return [false, errorMesage];
    });
}
exports.NotBlank = NotBlank;
/**
 * 长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小长度
 * @param max 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${max} | 字段长度必须大于或等于${min} | 字段长度必须介于${min} ~ ${max}
 */
function Length(min, max, errorMesage = null) {
    if (min == null) {
        errorMesage = errorMesage || `字段长度必须小于或等于${max}`;
    }
    else if (max == null) {
        errorMesage = errorMesage || `字段长度必须大于或等于${min}`;
    }
    else {
        errorMesage = errorMesage || `字段长度必须介于${min} ~ ${max}`;
    }
    return Func(a => {
        if (a == null) {
            return [true];
        }
        if ((min != null && a.length < min) || (max != null && a.length > max)) {
            return [false, errorMesage];
        }
        return [true];
    });
}
exports.Length = Length;
/**
 * 最小长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小长度
 * @param errorMesage 错误消息，默认为：字段长度必须大于或等于${length}
 */
function MinLength(length, errorMesage = null) {
    return Length(length, null, errorMesage);
}
exports.MinLength = MinLength;
/**
 * 最大长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${length}
 */
function MaxLength(length, errorMesage = null) {
    return Length(null, length, errorMesage);
}
exports.MaxLength = MaxLength;
/**
 * 数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小数值
 * @param max 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${max} | 字段值必须大于或等于${min} | 字段值必须介于${min} ~ ${max}
 */
function Range(min, max, errorMesage = null) {
    if (min == null) {
        errorMesage = errorMesage || `字段值必须小于或等于${max}`;
    }
    else if (max == null) {
        errorMesage = errorMesage || `字段值必须大于或等于${min}`;
    }
    else {
        errorMesage = errorMesage || `字段值必须介于${min} ~ ${max}`;
    }
    return Func(a => {
        if (a == null) {
            return [true];
        }
        if ((min != null && a < min) || (max != null && a > max)) {
            return [false, errorMesage];
        }
        return [true];
    });
}
exports.Range = Range;
/**
 * 最小数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最小数值
 * @param errorMesage 错误消息，默认为：字段值必须大于或等于${val}
 */
function Min(val, errorMesage = null) {
    return Range(val, null, errorMesage);
}
exports.Min = Min;
/**
 * 最大数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${val}
 */
function Max(val, errorMesage = null) {
    return Range(null, val, errorMesage);
}
exports.Max = Max;
/**
 * 小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小的小数位长度
 * @param max 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${max} | 小数点位数必须大于或等于${min} | 小数点位数必须介于${min} ~ ${max}
 */
function Decimal(min, max, errorMesage = null) {
    if (min == null) {
        errorMesage = errorMesage || `小数点位数必须小于或等于${max}`;
    }
    else if (max == null) {
        errorMesage = errorMesage || `小数点位数必须大于或等于${min}`;
    }
    else {
        errorMesage = errorMesage || `小数点位数必须介于${min} ~ ${max}`;
    }
    return Func(a => {
        if (a == null) {
            return [true];
        }
        if ((min != null && a.length < min) || (max != null && a.length > max)) {
            return [false, errorMesage];
        }
        return [true];
    });
}
exports.Decimal = Decimal;
/**
 * 最小小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须大于或等于${length}
 */
function MinDecimal(length, errorMesage = null) {
    return Decimal(length, null, errorMesage);
}
exports.MinDecimal = MinDecimal;
/**
 * 最大小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${length}
 */
function MaxDecimal(length, errorMesage = null) {
    return Decimal(null, length, errorMesage);
}
exports.MaxDecimal = MaxDecimal;
/**
 * 正则表达式验证器，只能用于String的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param pattern 正则规则
 * @param errorMesage 错误消息，默认为：字段格式不符合要求
 */
function Reg(pattern, errorMesage = null) {
    errorMesage = errorMesage || '字段格式不符合要求';
    return Func(a => {
        if (a == null) {
            return [true];
        }
        if (!a.match(pattern)) {
            return [false, errorMesage];
        }
        return [true];
    });
}
exports.Reg = Reg;
/**
 * 请求参数不合法异常
 */
class IllegalArgumentException extends Error {
    constructor(message, targetName, fieldName) {
        super(message);
        this.targetName = targetName;
        this.fieldName = fieldName;
    }
}
exports.IllegalArgumentException = IllegalArgumentException;
/**
 * 在组件中标记一个方法，使其在组件初始化时执行，支持异步方法
 */
function Init(target, name) {
    target.$initMethod = name;
}
exports.Init = Init;
/**
 * 指定Controller或者一个Action使用指定的Action过滤器
 * 只能用于Controller中
 * @param actionFilter 要使用的过滤器
 */
function UseActionFilter(actionFilter) {
    return function (target, name = null) {
        if (!actionFilter.prototype.$isFreeActionFilter) {
            console.warn(`UseActionFilter只能使用FreeActionFilter，此actionFilter(${actionFilter.name})将不会生效`);
            return;
        }
        if (name == null) {
            target.prototype.$actionFilters = target.prototype.$actionFilters || [];
            target.prototype.$actionFilters.unshift(actionFilter);
        }
        else {
            let action = target[name];
            action.$actionFilters = action.$actionFilters || [];
            action.$actionFilters.unshift(actionFilter);
        }
    };
}
exports.UseActionFilter = UseActionFilter;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行前执行
 */
function DoBefore(target, name) {
    target.$actionHandlerMap = target.$actionHandlerMap || new Map();
    target.$actionHandlerMap.set(DoBefore, name);
}
exports.DoBefore = DoBefore;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行后执行
 */
function DoAfter(target, name) {
    target.$actionHandlerMap = target.$actionHandlerMap || new Map();
    target.$actionHandlerMap.set(DoAfter, name);
}
exports.DoAfter = DoAfter;
/**
 * ActionFilter中DoBefore以及DoAfter方法接受到的参数
 */
class ActionFilterContext {
    constructor(ctx, params, paramTypes, controller, action) {
        this.ctx = ctx;
        this.params = params;
        this.paramTypes = paramTypes;
        this.controller = controller;
        this.action = action;
    }
}
exports.ActionFilterContext = ActionFilterContext;
/**
 * 指定Controller或者一个Action使用指定的异常过滤器
 * 只能用于Controller中
 * @param exceptionFilter 要使用的过滤器
 */
function UseExceptionFilter(exceptionFilter) {
    return function (target, name = null) {
        if (name == null) {
            target.prototype.$exceptionFilter = exceptionFilter;
        }
        else {
            let action = target[name];
            action.$exceptionFilter = exceptionFilter;
        }
    };
}
exports.UseExceptionFilter = UseExceptionFilter;
/**
 * 在ExceptionFilter中，标记一个方法，用于处理指定类型的异常
 * @param type 要处理的异常类型
 */
function ExceptionHandler(type) {
    return function (target, name) {
        target.$exceptionHandlerMap = target.$exceptionHandlerMap || new Map();
        target.$exceptionHandlerMap.set(type, name);
    };
}
exports.ExceptionHandler = ExceptionHandler;
/**
 * 标记此字段在reload的时候，保持在内存中并且继承到新的实例
 */
function KeepAlive(target, name) {
    target.$aliveFields = target.$aliveFields || [];
    target.$aliveFields.push(name);
}
exports.KeepAlive = KeepAlive;
let appMap = new Map();
let DogBootApplication = DogBootApplication_1 = class DogBootApplication {
    constructor(port = 3000, opts) {
        this.port = port;
        this.app = new Koa();
        this.init(opts);
    }
    static create(port = 3000, _opts) {
        let opts = _opts || {};
        let app;
        let lastApp = appMap.get(port);
        if (lastApp) {
            app = lastApp;
            app.init(opts);
        }
        else {
            app = new DogBootApplication_1(port, opts);
            appMap.set(port, app);
        }
        return app;
    }
    init(opts) {
        this.readyToAcceptRequest = false;
        this.globalExceptionFilter = null;
        this.globalActionFilters = [];
        this.render = opts.render;
        this.requestHandler = null;
        this.controllerClasses = [];
        this.prefix = opts.prefix;
        this.staticRootPathName = opts.staticRootPathName || 'public';
        this.controllerRootPathName = opts.controllerRootPathName || 'controller';
        this.startupRootPathName = opts.startupRootPathName || 'startup';
        this.filterRootPathName = opts.filterRootPathName || 'filter';
        this.enableApidoc = opts.enableApidoc != null ? opts.enableApidoc : false;
        this.apidocPrefix = opts.apidocPrefix || 'apidoc';
        this.enableCors = opts.enableCors != null ? opts.enableCors : false;
        this.corsOptions = opts.corsOptions;
        let diContainerOptions = {
            enableHotload: opts.enableHotload,
            hotloadDebounceInterval: opts.hotloadDebounceInterval
        };
        if (!this.container) {
            this.container = new DIContainer(diContainerOptions);
        }
        else {
            this.container.refresh(diContainerOptions);
        }
        this.container.setComponentInstance(DogBootApplication_1, this);
    }
    build() {
        let publicRootPath = path.join(Utils.getAppRootPath(), this.staticRootPathName);
        this.app.use(koaStatic(publicRootPath));
        this.app.use(koaBody());
        if (this.enableCors) {
            this.app.use(cors(this.corsOptions));
        }
        let controllerRootPath = path.join(Utils.getExecRootPath(), this.controllerRootPathName);
        let spiltStr = '/';
        if (process.platform == 'win32') {
            spiltStr = '\\';
        }
        Utils.getFileListInFolder(controllerRootPath).forEach(a => {
            let controllerFilePathArr = path.relative(controllerRootPath, a).replace(/Controller\.(ts|js)$/i, '').split(spiltStr);
            this.checkAndHandleControllerFile(a, controllerFilePathArr);
        });
    }
    checkAndHandleControllerFile(filePath, controllerFilePathArr) {
        let _Module = require(filePath);
        Object.values(_Module).filter(a => a instanceof Function && a.prototype.$isController).forEach((a) => { this.checkAndHandleControllerClass(a, controllerFilePathArr); });
    }
    checkAndHandleControllerClass(_Class, controllerFilePathArr) {
        let _prototype = _Class.prototype;
        let controllerPath = _prototype.$path;
        let prefix = '';
        let areaPrefixArr = controllerFilePathArr.slice(0, controllerFilePathArr.length - 1);
        if (areaPrefixArr.length) {
            prefix += '/' + areaPrefixArr.join('/');
        }
        prefix += controllerPath;
        let router = new Router({
            prefix
        });
        Object.getOwnPropertyNames(_prototype).forEach(a => {
            this.checkAndHandleActionName(a, _Class, controllerFilePathArr, router);
        });
        if (this.prefix) {
            router.prefix(this.prefix);
        }
        this.app.use(router.routes());
        this.controllerClasses.push(_Class);
    }
    checkAndHandleActionName(actionName, _Class, controllerFilePathArr, router) {
        let _prototype = _Class.prototype;
        let action = _prototype[actionName];
        if (!action.$method) {
            return;
        }
        router[action.$method](action.$path, (ctx) => __awaiter(this, void 0, void 0, function* () {
            while (!this.readyToAcceptRequest) {
                yield Utils.sleep(200);
            }
            try {
                yield this.handleContext(actionName, _Class, controllerFilePathArr, ctx);
            }
            catch (err) {
                let exceptionFilter = _prototype[actionName].$exceptionFilter || _prototype.$exceptionFilter || this.globalExceptionFilter;
                if (!exceptionFilter) {
                    throw err;
                }
                let exceptionFilterInstance = yield this.container.getComponentInstanceFromFactory(exceptionFilter);
                if (!exceptionFilter.prototype.$exceptionHandlerMap) {
                    throw err;
                }
                let handlerName = exceptionFilter.prototype.$exceptionHandlerMap.get(err.__proto__.constructor);
                if (!handlerName) {
                    handlerName = exceptionFilter.prototype.$exceptionHandlerMap.get(Error);
                }
                if (!handlerName) {
                    throw err;
                }
                yield exceptionFilterInstance[handlerName](err, ctx);
            }
        }));
    }
    handleContext(actionName, _Class, controllerFilePathArr, ctx) {
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
                    return DogUtils.getTypeSpecifiedValue(toType, originalVal);
                }
                else {
                    return originalVal;
                }
            });
            for (let b of params) {
                Utils.validateModel(b);
            }
            let actionFilterContext = new ActionFilterContext(ctx, params, $paramTypes, _Class, actionName);
            let actionFiltersOnController = _prototype.$actionFilters || [];
            let actionFiltersOnAction = instance[actionName].$actionFilters || [];
            let actionFilters = this.globalActionFilters.concat(actionFiltersOnController, actionFiltersOnAction);
            let actionFilterAndInstances = [];
            for (let actionFilter of actionFilters) {
                let handlerName = actionFilter.prototype.$actionHandlerMap.get(DoBefore);
                if (!handlerName) {
                    continue;
                }
                let filterInstance = yield this.container.getComponentInstanceFromFactory(actionFilter);
                actionFilterAndInstances.push([actionFilter, filterInstance]);
                yield filterInstance[handlerName](actionFilterContext);
                if (ctx.status != 404) {
                    break;
                }
            }
            if (ctx.status == 404) {
                let body = yield instance[actionName](...params);
                if (ctx.status == 404) {
                    if (body instanceof ViewResult) {
                        if (this.render) {
                            ctx.body = yield this.render(controllerFilePathArr, actionName, body.data);
                        }
                        else {
                            throw new Error('没有找到任何视图渲染器');
                        }
                    }
                    else {
                        ctx.body = body;
                    }
                }
            }
            for (let [actionFilter, filterInstance] of actionFilterAndInstances.reverse()) {
                let handlerName = actionFilter.prototype.$actionHandlerMap.get(DoAfter);
                if (!handlerName) {
                    continue;
                }
                yield filterInstance[handlerName](actionFilterContext);
            }
        });
    }
    startUp() {
        return __awaiter(this, void 0, void 0, function* () {
            let startupRootPath = path.join(Utils.getExecRootPath(), this.startupRootPathName);
            if (!fs.existsSync(startupRootPath)) {
                return;
            }
            let startUpFileList = Utils.getFileListInFolder(startupRootPath);
            let startUpClassList = [];
            for (let filePath of startUpFileList) {
                let _Module = require(filePath);
                Object.values(_Module).forEach(a => {
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
    initComponents() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let componentClass of this.controllerClasses) {
                yield this.container.getComponentInstanceFromFactory(componentClass);
            }
        });
    }
    initFilters() {
        return __awaiter(this, void 0, void 0, function* () {
            let filterRootPath = path.join(Utils.getExecRootPath(), this.filterRootPathName);
            if (!fs.existsSync(filterRootPath)) {
                return;
            }
            let filterFileList = Utils.getFileListInFolder(filterRootPath);
            let filterClassList = [];
            for (let filePath of filterFileList) {
                let _Module = require(filePath);
                Object.values(_Module).forEach(a => {
                    if (a instanceof Function) {
                        filterClassList.push(a);
                    }
                });
            }
            this.globalActionFilters = filterClassList.filter(a => a.prototype.$isActionFilter).sort((a, b) => b.prototype.$order - a.prototype.$order);
            this.globalExceptionFilter = filterClassList.find(a => a.prototype.$isExceptionFilter);
            for (let filter of this.globalActionFilters) {
                yield this.container.getComponentInstanceFromFactory(filter);
            }
            if (this.globalExceptionFilter) {
                yield this.container.getComponentInstanceFromFactory(this.globalExceptionFilter);
            }
        });
    }
    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    runAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let startTime = Date.now();
            this.app.middleware = [];
            this.build();
            this.requestHandler = this.app.callback();
            let lastServer = this.server;
            if (!lastServer) {
                this.server = http.createServer((req, res) => {
                    this.requestHandler(req, res);
                }).listen(this.port);
            }
            yield this.startUp();
            yield this.initComponents();
            yield this.initFilters();
            this.readyToAcceptRequest = true;
            let endTime = Date.now();
            console.log(`Your application has ${lastServer ? 'reloaded' : 'started'} at ${this.port} in ${endTime - startTime}ms`);
            return this;
        });
    }
};
DogBootApplication = DogBootApplication_1 = __decorate([
    Component,
    __metadata("design:paramtypes", [Number, Object])
], DogBootApplication);
exports.DogBootApplication = DogBootApplication;
/**
 * 指定此类为控制器
 * Controller是一种特殊的Component
 * @param path 映射到的路由，默认取类名前一部分，比如HomeController默认映射到/Home，Home也映射到/Home
 */
function Controller(path = null) {
    return function (target) {
        target.prototype.$path = path || '/' + target.name.replace(/Controller$/i, '');
        target.prototype.$isController = true;
        Utils.markAsComponent(target);
    };
}
exports.Controller = Controller;
/**
 * 映射此方法为Action
 * @param type method类型，默认为get
 * @param path 映射到的路由，默认为action名称
 */
function Mapping(type = 'get', path = null) {
    return function (target, name) {
        let action = target[name];
        action.$method = type.toLowerCase();
        action.$path = path || '/' + action.name;
        action.$paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    };
}
exports.Mapping = Mapping;
/**
 * 映射此方法为Action，允许所有类型的method请求
 * @param path 映射到的路由，默认为action名称
 */
function AllMapping(path = null) {
    return Mapping('all', path);
}
exports.AllMapping = AllMapping;
/**
 * 映射此方法为Action，只允许get请求
 * @param path 映射到的路由，默认为action名称
 */
function GetMapping(path = null) {
    return Mapping('get', path);
}
exports.GetMapping = GetMapping;
/**
 * 映射此方法为Action，只允许post请求
 * @param path 映射到的路由，默认为action名称
 */
function PostMapping(path = null) {
    return Mapping('post', path);
}
exports.PostMapping = PostMapping;
/**
 * 映射此方法为Action，只允许put请求
 * @param path 映射到的路由，默认为action名称
 */
function PutMapping(path = null) {
    return Mapping('put', path);
}
exports.PutMapping = PutMapping;
/**
 * 映射此方法为Action，只允许patch请求
 * @param path 映射到的路由，默认为action名称
 */
function PatchMapping(path = null) {
    return Mapping('patch', path);
}
exports.PatchMapping = PatchMapping;
/**
 * 映射此方法为Action，只允许delete请求
 * @param path 映射到的路由，默认为action名称
 */
function DeleteMapping(path = null) {
    return Mapping('delete', path);
}
exports.DeleteMapping = DeleteMapping;
/**
 * 映射此方法为Action，只允许head请求
 * @param path 映射到的路由，默认为action名称
 */
function HeadMapping(path = null) {
    return Mapping('head', path);
}
exports.HeadMapping = HeadMapping;
/**
 * 绑定koa原生的context
 * 只能在Controller中使用
 */
function BindContext(target, name, index) {
    target[name].$params = target[name].$params || [];
    target[name].$params[index] = (ctx) => [ctx, false];
}
exports.BindContext = BindContext;
/**
 * 绑定koa原生的request
 * 只能在Controller中使用
 */
function BindRequest(target, name, index) {
    target[name].$params = target[name].$params || [];
    target[name].$params[index] = (ctx) => [ctx.request, false];
}
exports.BindRequest = BindRequest;
/**
 * 绑定koa原生的response
 * 只能在Controller中使用
 */
function BindResponse(target, name, index) {
    target[name].$params = target[name].$params || [];
    target[name].$params[index] = (ctx) => [ctx.response, false];
}
exports.BindResponse = BindResponse;
/**
 * 绑定url中的query参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
function BindQuery(key) {
    return function (target, name, index) {
        target[name].$params = target[name].$params || [];
        target[name].$params[index] = (ctx) => [ctx.query[key], true];
    };
}
exports.BindQuery = BindQuery;
/**
 * 绑定url中的path参数
 * 只能在Controller中使用
 * @param key 参数名称
 */
function BindPath(key) {
    return function (target, name, index) {
        target[name].$params = target[name].$params || [];
        target[name].$params[index] = (ctx) => [ctx.params[key], true];
    };
}
exports.BindPath = BindPath;
/**
 * 只能在Controller中使用
 * 绑定请求体参数
 */
function BindBody(target, name, index) {
    target[name].$params = target[name].$params || [];
    target[name].$params[index] = (ctx) => [ctx.request.body, true];
}
exports.BindBody = BindBody;
/**
 * 表示一个html输出
 */
class ViewResult {
    constructor(data) {
        this.data = data;
    }
}
exports.ViewResult = ViewResult;
//# sourceMappingURL=DogBoot.js.map