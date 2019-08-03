import fs = require('fs');
import path = require('path');

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
     * 获取指定目录下js或者ts文件列表
     * @param dirPath 指定的目录
     */
    static getFileListInFolder(dirPath: string) {
        let list = fs.readdirSync(dirPath)
        let fileList = []
        list.forEach(a => {
            let filePath = path.join(dirPath, a)
            let fileState = fs.statSync(filePath)
            if (fileState.isDirectory()) {
                fileList = fileList.concat(this.getFileListInFolder(filePath))
            } else {
                if ((filePath.endsWith('.ts') || filePath.endsWith('js')) && !filePath.endsWith('.d.ts')) {
                    fileList.push(filePath)
                }
            }
        })
        return fileList
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
        return process.env.dogbootEntry || process.mainModule.filename
    }

    static getAppRootPath() {
        return path.resolve(Utils.getEntryFilename(), '..', '..')
    }

    static getExecRootPath() {
        if (Utils.getEntryFilename().endsWith('.ts')) {
            return path.join(this.getAppRootPath(), 'src')
        } else {
            return path.join(this.getAppRootPath(), 'bin')
        }
    }

    static getConfigFilename(configName: string) {
        return path.join(this.getAppRootPath(), configName)
    }
}