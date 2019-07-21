import { TypeSpecifiedMap } from "./TypeSpecifiedMap";
import { TypeSpecifiedType } from "./TypeSpecifiedType";

/**
 * 包含一些公开的实用工具方法
 */
export class DogUtils {
    /**
     * 获取指定类型的对象
     * @param type 指定的类型
     * @param sourceVal 原始对象
     * @param valIfNull 如果originalVal == null则返回的值
     */
    static getTypeSpecifiedValue<T>(type: Function, sourceVal: any, valIfNull: T = null): T {
        if (sourceVal == null) {
            return valIfNull
        }
        switch (type) {
            case Number:
            case String:
            case Boolean:
                return type(sourceVal)
            case Date:
                return new Date(sourceVal) as any
            default:
                let newVal = Reflect.construct(type, [])
                let sourceFields = type.prototype.$sourceFields || {}
                for (let sourceField in sourceVal) {
                    let sourceFieldVal = sourceVal[sourceField]
                    let typeSpecifiedMap: TypeSpecifiedMap = sourceFields[sourceField] as TypeSpecifiedMap
                    if (typeSpecifiedMap == null) {
                        newVal[sourceField] = sourceFieldVal
                    } else {
                        let targetField = typeSpecifiedMap.targetName
                        if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.General) {
                            newVal[targetField] = this.getTypeSpecifiedValue(typeSpecifiedMap.type, sourceFieldVal)
                        } else if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType.Array) {
                            if (Array.isArray(sourceFieldVal)) {
                                newVal[targetField] = sourceFieldVal.map((a: any) => this.getTypeSpecifiedValue(typeSpecifiedMap.type, a))
                            } else {
                                newVal[targetField] = null
                            }
                        }
                    }
                }
                return newVal
        }
    }

    /**
     * 获取指定类型的数组对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValueArray<T>(type: Function, originalVal: any[], valIfNull: T[] = null): T[] {
        if (originalVal == null) {
            return valIfNull
        }
        return originalVal.map(a => this.getTypeSpecifiedValue(type, a))
    }
}