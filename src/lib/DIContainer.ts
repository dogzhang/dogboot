import chokidar = require('chokidar');
import { EventEmitter } from 'events';
import { Utils } from './Utils';
import { DogUtils } from './DogUtils';
import { DIContainerOptions } from './DIContainerOptions';

export class DIContainer extends EventEmitter {
    private componentInstanceMapKeyByFilenameAndClassName: Map<string, Map<string, any>> = new Map()
    private componentInstanceMap: Map<any, any> = new Map()
    private watcher: chokidar.FSWatcher
    private opts: DIContainerOptions
    private configPathSet: Set<string> = new Set()

    on<K extends 'reload', T extends {
        'reload': () => void
    }>(event: K, listener: T[K]): this {
        return super.on(event, listener)
    }

    async init() {
        this.componentInstanceMap.set(DIContainer, this)
        this.opts = await this.getComponentInstanceFromFactory(DIContainerOptions)
        if (this.opts.enableHotload == true) {
            this.watch()
        }
    }

    private async watch() {
        this.watcher = chokidar.watch([Utils.getExecRootPath()], {
            ignoreInitial: true,
            ignorePermissionErrors: true
        })

        let st: NodeJS.Timeout
        this.watcher.on('all', () => {
            clearTimeout(st)
            st = setTimeout(() => {
                this.reload()
            }, this.opts.hotloadDebounceInterval)
        })
    }

    private reload() {
        Utils.getFileListInFolder(Utils.getExecRootPath()).forEach(a => {
            if (require.cache[a]) {
                delete require.cache[a]
            }
        })
        this.configPathSet.forEach(a => {
            delete require.cache[a]
        })
        this.configPathSet.clear()
        this.componentInstanceMap.clear()
        this.emit('reload')
    }

    /**
     * 将已经实例化好的对象添加进容器
     * @param target 类型
     * @param instance 实例
     */
    setComponentInstance<T>(target: new (...args: any[]) => T, instance: T) {
        this.componentInstanceMap.set(target, instance)
    }

    /**
     * 以同步的方式根据指定类型从容器取出实例
     * @param target 类型
     */
    getComponentInstance<T>(target: new (...args: any[]) => T): T {
        return this.componentInstanceMap.get(target)
    }

    /**
     * 从工厂获取指定类型的组件实例，如果此组件类型没有一个可用实例，会创建一个实例然后返回给调用者
     * 这是一个异步方法，不能在构造器中起作用，所以请仅仅在程序启动的时候使用此方法
     * 程序运行中获取实例应该使用同步方法getComponentInstance
     * @param target 组件类型
     */
    async getComponentInstanceFromFactory<T>(target: new (...args: any[]) => T): Promise<T> {
        let instance = this.componentInstanceMap.get(target)
        if (instance) {
            return await instance
        }

        let instancePromise = this.createComponentInstance(target)
        this.componentInstanceMap.set(target, instancePromise)

        return instancePromise
    }

    private async createComponentInstance<T>(target: new (...args: any[]) => T): Promise<T> {
        if (!target.prototype.$isComponent) {
            throw new Error(`${target.name}没有被注册为可自动解析的组件，请至少添加@Component、@StartUp、@Controller、@Config等装饰器中的一种`)
        }
        let map = this.componentInstanceMapKeyByFilenameAndClassName.get(target.prototype.$filename) || new Map()
        let lastInstance = map.get(target.name)

        let instance = null
        if (target.prototype.$isConfig) {
            instance = this.getConfigValue(target)
            this.componentInstanceMap.set(target, instance)
        } else {
            instance = Reflect.construct(target, await this.getParamInstances(target))
            this.componentInstanceMap.set(target, instance)
            await this.resolveAutowiredDependences(instance)

            if (lastInstance) {
                if (target.prototype.$aliveFields) {
                    target.prototype.$aliveFields.forEach((a: string) => {
                        if (lastInstance.hasOwnProperty(a)) {
                            instance[a] = lastInstance[a]
                        }
                    })
                }
            }

            let initMethod = target.prototype.$initMethod
            if (initMethod) {
                await instance[initMethod](lastInstance)
            }
        }

        map.set(target.name, instance)
        this.componentInstanceMapKeyByFilenameAndClassName.set(target.prototype.$filename, map)

        return instance
    }

    private async getParamInstances(target: new (...args: any[]) => {}): Promise<any[]> {
        let paramTypes = target.prototype.$paramTypes
        let paramInstances = []
        for (let paramType of paramTypes) {
            let paramInstance = await this.getComponentInstanceFromFactory(paramType)
            paramInstances.push(paramInstance)
        }
        return paramInstances
    }

    private async resolveAutowiredDependences(instance: any) {
        let target = instance.__proto__.constructor
        let autowiredMap = target.prototype.$autowiredMap
        if (autowiredMap) {
            for (let [k, v] of autowiredMap) {
                if (v.name) {
                    instance[k] = await this.getComponentInstanceFromFactory(v as any)
                } else {
                    let _Class = v()
                    instance[k] = await this.getComponentInstanceFromFactory(_Class as any)
                }
            }
        }
    }

    private getConfigValue<T>(target: new (...args: any[]) => T): T {
        let configName = target.prototype.$configName
        let configFilePath = Utils.getConfigFilename(configName)
        let originalVal = null
        try {
            originalVal = require(configFilePath)
            this.addConfigFilePath(configFilePath)
        } catch{ }
        let sectionArr = target.prototype.$configField.split('.').filter((a: any) => a)
        for (let a of sectionArr) {
            if (originalVal == null) {
                break
            }
            originalVal = originalVal[a]
        }
        return DogUtils.getTypeSpecifiedValue(target, originalVal, new target())
    }

    private addConfigFilePath(configFilePath: string) {
        if (!this.opts) {
            return
        }
        if (!this.opts.enableHotload) {
            return
        }
        if (this.configPathSet.has(configFilePath)) {
            return
        }
        this.configPathSet.add(configFilePath)
        this.watcher.add(configFilePath)
    }
}