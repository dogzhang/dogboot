"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeSpecifiedType_1 = require("./TypeSpecifiedType");
/**
 * 包含一些公开的实用工具方法
 */
class DogUtils {
    /**
     * 获取指定类型的对象
     * @param type 指定的类型
     * @param sourceVal 原始对象
     * @param valIfNull 如果originalVal == null则返回的值
     */
    static getTypeSpecifiedValue(type, sourceVal, valIfNull = null) {
        if (sourceVal == null) {
            return valIfNull;
        }
        switch (type) {
            case Number:
            case String:
            case Boolean:
                return type(sourceVal);
            case Date:
                return new Date(sourceVal);
            default:
                let newVal = Reflect.construct(type, []);
                let sourceFields = type.prototype.$sourceFields || {};
                for (let sourceField in sourceVal) {
                    let sourceFieldVal = sourceVal[sourceField];
                    let typeSpecifiedMap = sourceFields[sourceField];
                    if (typeSpecifiedMap == null) {
                        newVal[sourceField] = sourceFieldVal;
                    }
                    else {
                        let targetField = typeSpecifiedMap.targetName;
                        if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType_1.TypeSpecifiedType.General) {
                            newVal[targetField] = this.getTypeSpecifiedValue(typeSpecifiedMap.type, sourceFieldVal);
                        }
                        else if (typeSpecifiedMap.typeSpecifiedType == TypeSpecifiedType_1.TypeSpecifiedType.Array) {
                            if (Array.isArray(sourceFieldVal)) {
                                newVal[targetField] = sourceFieldVal.map((a) => this.getTypeSpecifiedValue(typeSpecifiedMap.type, a));
                            }
                            else {
                                newVal[targetField] = null;
                            }
                        }
                    }
                }
                return newVal;
        }
    }
    /**
     * 获取指定类型的数组对象
     * @param type 指定的类型
     * @param originalVal 原始对象
     */
    static getTypeSpecifiedValueArray(type, originalVal, valIfNull = null) {
        if (originalVal == null) {
            return valIfNull;
        }
        return originalVal.map(a => this.getTypeSpecifiedValue(type, a));
    }
}
exports.DogUtils = DogUtils;
//# sourceMappingURL=DogUtils.js.map