/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class DIContainer extends EventEmitter {
    private componentInstanceMapKeyByFilenameAndClassName;
    private componentInstanceMap;
    private watcher;
    private opts;
    private configPathSet;
    on<K extends 'reload', T extends {
        'reload': () => void;
    }>(event: K, listener: T[K]): this;
    init(): Promise<void>;
    private watch;
    private reload;
    /**
     * 将已经实例化好的对象添加进容器
     * @param target 类型
     * @param instance 实例
     */
    setComponentInstance<T>(target: new (...args: any[]) => T, instance: T): void;
    /**
     * 以同步的方式根据指定类型从容器取出实例
     * @param target 类型
     */
    getComponentInstance<T>(target: new (...args: any[]) => T): T;
    /**
     * 从工厂获取指定类型的组件实例，如果此组件类型没有一个可用实例，会创建一个实例然后返回给调用者
     * 这是一个异步方法，不能在构造器中起作用，所以请仅仅在程序启动的时候使用此方法
     * 程序运行中获取实例应该使用同步方法getComponentInstance
     * @param target 组件类型
     */
    getComponentInstanceFromFactory<T>(target: new (...args: any[]) => T): Promise<T>;
    private createComponentInstance;
    private getParamInstances;
    private resolveAutowiredDependences;
    private getConfigValue;
    private addConfigFilePath;
}
