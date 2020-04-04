"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const TypeSpecifiedType_1 = require("./TypeSpecifiedType");
/**
 * 一些工具方法
 */
class Utils {
    /**
     * 标记为组件
     * @param target 目标类型
     */
    static markAsComponent(target) {
        Reflect.defineMetadata('$isComponent', true, target.prototype);
        let paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
        if (paramTypes.includes(target)) {
            console.error(`${target.name}中存在自我依赖`);
            process.abort();
        }
        Reflect.defineMetadata('$paramTypes', paramTypes, target.prototype);
    }
    /**
     * 递归获取指定文件夹下所有文件列表
     * @param dirPath 指定的文件夹
     */
    static getAllFileListInDir(dirPath) {
        let list = fs.readdirSync(dirPath);
        let fileList = [];
        list.forEach(a => {
            let filePath = path.join(dirPath, a);
            let fileState = fs.statSync(filePath);
            if (fileState.isDirectory()) {
                fileList = fileList.concat(this.getAllFileListInDir(filePath));
            }
            else {
                fileList.push(filePath);
            }
        });
        return fileList;
    }
    /**
     * 获取指定文件夹下所有子文件夹，不包含文件夹以及子文件夹内的文件
     * @param dirPath 指定的文件夹
     */
    static getDirListInDir(dirPath) {
        let list = fs.readdirSync(dirPath);
        return list.filter(a => {
            let filePath = path.join(dirPath, a);
            let fileState = fs.statSync(filePath);
            return fileState.isDirectory();
        });
    }
    /**
     * 获取指定文件夹下的所有文件列表，不包含文件以及子文件夹内的文件夹
     * @param dirPath 指定的文件夹
     */
    static getFileListInDir(dirPath) {
        let list = fs.readdirSync(dirPath);
        return list.filter(a => {
            let filePath = path.join(dirPath, a);
            let fileState = fs.statSync(filePath);
            return fileState.isFile();
        });
    }
    static getValidator(obj) {
        return obj != null && obj.__proto__ && Reflect.getMetadata('$validator', obj.__proto__);
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
    static getEntryFilename() {
        return process.env.dogEntry || process.mainModule.filename;
    }
    static getAppRootPath() {
        if (!this.appRootPath) {
            this.appRootPath = path.resolve(Utils.getEntryFilename(), '..', '..');
        }
        return this.appRootPath;
    }
    static getExecRootPath() {
        if (!this.execRootPath) {
            if (Utils.getEntryFilename().endsWith('.ts')) {
                this.execRootPath = path.join(this.getAppRootPath(), 'src');
            }
            else {
                this.execRootPath = path.join(this.getAppRootPath(), 'bin');
            }
        }
        return this.execRootPath;
    }
    static getConfigFilename() {
        return path.join(this.getAppRootPath(), 'config.json');
    }
    /**
     * 获取配置值
     * @param target 配置类型
     */
    static getConfigValue(target) {
        let configFilePath = Utils.getConfigFilename();
        let originalVal = this.tryRequire(configFilePath);
        let newVal = Utils.getValBySectionStr(originalVal, Reflect.getMetadata('$configField', target.prototype));
        return Utils.getTypeSpecifiedValue(target, newVal, new target());
    }
    static tryRequire(filePath) {
        if (filePath.endsWith('.map') || filePath.endsWith('.d.ts')) {
            return null;
        }
        try {
            return require(filePath);
        }
        catch (error) {
            return null;
        }
    }
    static getValBySectionArr(originalVal, sectionArr) {
        let newVal = originalVal;
        for (let a of sectionArr) {
            if (newVal == null) {
                break;
            }
            newVal = newVal[a];
        }
        return newVal;
    }
    static getValBySectionStr(originalVal, keysStr) {
        let sectionArr = keysStr.split('.').filter(a => a);
        return Utils.getValBySectionArr(originalVal, sectionArr);
    }
    /**
     * 获取指定类型的对象
     * @param type 指定的类型
     * @param sourceVal 原始对象
     * @param valIfNull 如果originalVal == null则返回的值
     */
    static getTypeSpecifiedValue(type, sourceVal, valIfNull = null) {
        if (sourceVal == null) {
            return valIfNull;
        }
        switch (type) {
            case Number:
            case Boolean:
                if (sourceVal === '') {
                    return null;
                }
                return type(sourceVal);
            case String:
                return type(sourceVal).trim();
            case Date:
                if (sourceVal === '') {
                    return null;
                }
                return new Date(sourceVal);
            default:
                let newVal = Reflect.construct(type, []);
                let sourceFields = Reflect.getMetadata('$sourceFields', type.prototype) || {};
                for (let sourceField in sourceVal) {
                    let sourceFieldVal = sourceVal[sourceField];
                    let typeSpecifiedMap = sourceFields[sourceField];
                    if (typeSpecifiedMap == null) {
                        newVal[sourceField] = sourceFieldVal;
                    }
                    else {
                        let targetField = typeSpecifiedMap.targetName;
                        if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType_1.TypeSpecifiedType.General) {
                            newVal[targetField] = this.getTypeSpecifiedValue(typeSpecifiedMap.type, sourceFieldVal);
                        }
                        else if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType_1.TypeSpecifiedType.Array) {
                            if (Array.isArray(sourceFieldVal)) {
                                newVal[targetField] = sourceFieldVal.map((a) => this.getTypeSpecifiedValue(typeSpecifiedMap.type, a));
                            }
                            else {
                                newVal[targetField] = null;
                            }
                        }
                    }
                }
                return newVal;
        }
    }
    /**
     * 获取指定类型的数组对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValueArray(type, originalVal, valIfNull = null) {
        if (originalVal == null) {
            return valIfNull;
        }
        return originalVal.map(a => this.getTypeSpecifiedValue(type, a));
    }
    static formatDate(dt, format) {
        let result = {};
        result.yyyy = dt.getFullYear();
        result.MM = dt.getMonth() + 1;
        result.dd = dt.getDate();
        result.HH = dt.getHours();
        result.mm = dt.getMinutes();
        result.ss = dt.getSeconds();
        let _result = format;
        for (let p in result) {
            _result = _result.replace(p, result[p].toString().padStart(p.length, '0'));
        }
        return _result;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map