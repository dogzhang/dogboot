import fs = require('fs');
import path = require('path');
import { DogUtils } from './DogUtils';

/**
 * 仅仅被dogboot使用的内部工具方法
 */
export class Utils {
    /**
     * 标记为组件
     * @param target 目标类型
     */
    static markAsComponent(target: new (...args: any[]) => {}) {
        target.prototype.$isComponent = true
        let paramTypes: Array<Function> = Reflect.getMetadata('design:paramtypes', target) || []
        if (paramTypes.includes(target)) {
            console.error(`${target.name}中存在自我依赖`)
            process.abort()
        }
        target.prototype.$paramTypes = paramTypes
    }

    /**
     * 递归获取指定文件夹下所有文件列表
     * @param dirPath 指定的文件夹
     */
    static getAllFileListInDir(dirPath: string) {
        let list = fs.readdirSync(dirPath)
        let fileList: string[] = []
        list.forEach(a => {
            let filePath = path.join(dirPath, a)
            let fileState = fs.statSync(filePath)
            if (fileState.isDirectory()) {
                fileList = fileList.concat(this.getAllFileListInDir(filePath))
            } else {
                fileList.push(filePath)
            }
        })
        return fileList
    }

    /**
     * 获取指定文件夹下所有文件列表，不包含文件夹以及子文件夹内的文件
     * @param dirPath 指定的文件夹
     */
    static getDirListInDir(dirPath: string) {
        let list = fs.readdirSync(dirPath)
        return list.filter(a => {
            let filePath = path.join(dirPath, a)
            let fileState = fs.statSync(filePath)
            return fileState.isDirectory()
        })
    }

    /**
     * 获取指定文件夹下的所有子文件夹，不包含文件以及子文件夹内的文件夹
     * @param dirPath 指定的文件夹
     */
    static getFileListInDir(dirPath: string) {
        let list = fs.readdirSync(dirPath)
        return list.filter(a => {
            let filePath = path.join(dirPath, a)
            let fileState = fs.statSync(filePath)
            return fileState.isFile()
        })
    }

    private static getValidator(obj: any) {
        return obj != null && obj.__proto__ && obj.__proto__.$validator
    }

    /**
     * 验证模型是否合法，第一个不合法的字段会导致此方法抛出异常IllegalArgumentException
     * @param model 待验证的模型对象
     */
    static validateModel(model: any) {
        let validator = this.getValidator(model)
        if (!validator) {
            return
        }
        let entries = Object.entries(validator)
        for (let entrie of entries) {
            let k = entrie[0]
            let fieldVal = model[k]
            if (fieldVal instanceof Array) {
                for (let a of fieldVal) {
                    this.validateModel(a)
                }
            } else {
                this.validateModel(fieldVal)
            }
            let v = entrie[1]
            let funcList = v as Function[]
            for (let func of funcList) {
                func(fieldVal)
            }
        }
    }

    static sleep(milliseconds: number) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve()
            }, milliseconds)
        })
    }

    static getEntryFilename() {
        return process.env.dogEntry || process.mainModule.filename
    }

    private static appRootPath: string
    static getAppRootPath() {
        if (!this.appRootPath) {
            this.appRootPath = path.resolve(Utils.getEntryFilename(), '..', '..')
        }
        return this.appRootPath
    }

    private static execRootPath: string
    static getExecRootPath() {
        if (!this.execRootPath) {
            if (Utils.getEntryFilename().endsWith('.ts')) {
                this.execRootPath = path.join(this.getAppRootPath(), 'src')
            } else {
                this.execRootPath = path.join(this.getAppRootPath(), 'bin')
            }
        }
        return this.execRootPath
    }

    static getConfigFilename(configName: string) {
        return path.join(this.getAppRootPath(), configName)
    }

    /**
     * 获取配置值
     * @param target 配置类型
     */
    static getConfigValue<T>(target: new (...args: any[]) => T): [T, string] {
        let configName = target.prototype.$configName
        let configFilePath = Utils.getConfigFilename(configName)
        let originalVal = this.tryRequire(configFilePath)
        let sectionArr = target.prototype.$configField.split('.').filter((a: any) => a)
        for (let a of sectionArr) {
            if (originalVal == null) {
                break
            }
            originalVal = originalVal[a]
        }
        return [DogUtils.getTypeSpecifiedValue(target, originalVal, new target()), configFilePath]
    }

    static tryRequire(filePath: string) {
        try {
            return require(filePath)
        } catch (error) {
            return null
        }
    }
}