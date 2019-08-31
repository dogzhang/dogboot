"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const DogUtils_1 = require("./DogUtils");
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
     * 获取指定文件夹下所有文件列表，不包含文件夹以及子文件夹内的文件
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
     * 获取指定文件夹下的所有子文件夹，不包含文件以及子文件夹内的文件夹
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
    static getConfigFilename(configName) {
        return path.join(this.getAppRootPath(), configName);
    }
    /**
     * 获取配置值
     * @param target 配置类型
     */
    static getConfigValue(target) {
        let configName = target.prototype.$configName;
        let configFilePath = Utils.getConfigFilename(configName);
        let originalVal = this.tryRequire(configFilePath);
        let sectionArr = target.prototype.$configField.split('.').filter((a) => a);
        for (let a of sectionArr) {
            if (originalVal == null) {
                break;
            }
            originalVal = originalVal[a];
        }
        return [DogUtils_1.DogUtils.getTypeSpecifiedValue(target, originalVal, new target()), configFilePath];
    }
    static tryRequire(filePath) {
        try {
            return require(filePath);
        }
        catch (error) {
            return null;
        }
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map