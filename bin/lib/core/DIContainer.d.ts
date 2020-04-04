export declare class DIContainer {
    readonly startTime: number;
    private componentSet;
    private componentInstanceMap;
    constructor();
    /**
     * 将已经实例化好的对象添加进容器
     * @param target 类型
     * @param instance 实例
     */
    setComponentInstance<T>(target: new (...args: any[]) => T, instance: T): void;
    /**
     * 以同步的方式根据指定类型从容器取出实例，需要确保此时类实例已经存在
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
    loadClass(_class: new (...args: any[]) => {}): this;
    loadModule(_Module: any): this;
    loadFile(filename: string): this;
    loadDir(dir: string): this;
    getComponentsByTag(tag: string): (new (...args: any[]) => {})[];
    private initStartUps;
    private test;
    runAsync(): Promise<this>;
}
export declare function getContainer(): DIContainer;
