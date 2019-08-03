/**
 * 包含一些公开的实用工具方法
 */
export declare class DogUtils {
    /**
     * 获取指定类型的对象
     * @param type 指定的类型
     * @param sourceVal 原始对象
     * @param valIfNull 如果originalVal == null则返回的值
     */
    static getTypeSpecifiedValue<T>(type: Function, sourceVal: any, valIfNull?: T): T;
    /**
     * 获取指定类型的数组对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValueArray<T>(type: Function, originalVal: any[], valIfNull?: T[]): T[];
}
