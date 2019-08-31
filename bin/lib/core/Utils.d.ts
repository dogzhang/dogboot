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
     * 递归获取指定文件夹下所有文件列表
     * @param dirPath 指定的文件夹
     */
    static getAllFileListInDir(dirPath: string): string[];
    /**
     * 获取指定文件夹下所有文件列表，不包含文件夹以及子文件夹内的文件
     * @param dirPath 指定的文件夹
     */
    static getDirListInDir(dirPath: string): string[];
    /**
     * 获取指定文件夹下的所有子文件夹，不包含文件以及子文件夹内的文件夹
     * @param dirPath 指定的文件夹
     */
    static getFileListInDir(dirPath: string): string[];
    private static getValidator;
    /**
     * 验证模型是否合法，第一个不合法的字段会导致此方法抛出异常IllegalArgumentException
     * @param model 待验证的模型对象
     */
    static validateModel(model: any): void;
    static sleep(milliseconds: number): Promise<unknown>;
    static getEntryFilename(): string;
    private static appRootPath;
    static getAppRootPath(): string;
    private static execRootPath;
    static getExecRootPath(): string;
    static getConfigFilename(configName: string): string;
    /**
     * 获取配置值
     * @param target 配置类型
     */
    static getConfigValue<T>(target: new (...args: any[]) => T): [T, string];
    static tryRequire(filePath: string): any;
}
