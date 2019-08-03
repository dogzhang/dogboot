"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeSpecifiedMap_1 = require("./TypeSpecifiedMap");
const TypeSpecifiedType_1 = require("./TypeSpecifiedType");
/**
 * 指定此字段需要转换为指定类型，仅仅支持Number、String、Date
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
function Typed(sourceNameOrGetSourceNameFunc = null) {
    return function (target, name) {
        target.$sourceFields = target.$sourceFields || {};
        let sourceName = getSourceName(name, sourceNameOrGetSourceNameFunc);
        target.$sourceFields[sourceName] = new TypeSpecifiedMap_1.TypeSpecifiedMap(TypeSpecifiedType_1.TypeSpecifiedType.General, Reflect.getMetadata('design:type', target, name), sourceName, name);
    };
}
exports.Typed = Typed;
/**
 * 指定此Array字段的确切类型需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
function TypedArray(type, sourceNameOrGetSourceNameFunc = null) {
    return function (target, name) {
        target.$sourceFields = target.$sourceFields || {};
        let sourceName = getSourceName(name, sourceNameOrGetSourceNameFunc);
        target.$sourceFields[sourceName] = new TypeSpecifiedMap_1.TypeSpecifiedMap(TypeSpecifiedType_1.TypeSpecifiedType.Array, type, sourceName, name);
    };
}
exports.TypedArray = TypedArray;
function getSourceName(targetName, sourceNameOrGetSourceNameFunc = null) {
    if (!sourceNameOrGetSourceNameFunc) {
        return targetName;
    }
    if (typeof sourceNameOrGetSourceNameFunc == 'string') {
        return sourceNameOrGetSourceNameFunc;
    }
    return sourceNameOrGetSourceNameFunc(targetName);
}
//# sourceMappingURL=TypeConvert.js.map