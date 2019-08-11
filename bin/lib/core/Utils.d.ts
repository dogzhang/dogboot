/**
 * 仅仅被dogboot使用的内部工具方法
 */
export declare class Utils {
    /**
     * 标记为组件
     * @param target 目标类型
     */
    static markAsComponent(target: new (...args: any[]) => {}): void;
    /**
     * 获取指定目录下js或者ts文件列表
     * @param dirPath 指定的目录
     */
    static getFileListInFolder(dirPath: string): string[];
    private static getValidator;
    /**
     * 验证模型是否合法，第一个不合法的字段会导致此方法抛出异常IllegalArgumentException
     * @param model 待验证的模型对象
     */
    static validateModel(model: any): void;
    static sleep(milliseconds: number): Promise<unknown>;
    static getEntryFilename(): string;
    static getAppRootPath(): string;
    static getExecRootPath(): string;
    static getConfigFilename(configName: string): string;
    /**
     * 获取配置值
     * @param target 配置类型
     */
    static getConfigValue<T>(target: new (...args: any[]) => T): [T, string];
}
