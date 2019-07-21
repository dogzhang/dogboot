import { TypeSpecifiedMap } from "./TypeSpecifiedMap";
import { TypeSpecifiedType } from "./TypeSpecifiedType";

/**
 * 指定此字段需要转换为指定类型，仅仅支持Number、String、Date
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export function Typed(sourceNameOrGetSourceNameFunc: string | ((targetName: string) => string) = null) {
    return function (target: any, name: string) {
        target.$sourceFields = target.$sourceFields || {}
        let sourceName = getSourceName(name, sourceNameOrGetSourceNameFunc)
        target.$sourceFields[sourceName] = new TypeSpecifiedMap(TypeSpecifiedType.General, Reflect.getMetadata('design:type', target, name), sourceName, name)
    }
}

/**
 * 指定此Array字段的确切类型需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export function TypedArray(type: Function, sourceNameOrGetSourceNameFunc: string | ((targetName: string) => string) = null) {
    return function (target: any, name: string) {
        target.$sourceFields = target.$sourceFields || {}
        let sourceName = getSourceName(name, sourceNameOrGetSourceNameFunc)
        target.$sourceFields[sourceName] = new TypeSpecifiedMap(TypeSpecifiedType.Array, type, sourceName, name)
    }
}

function getSourceName(targetName: string, sourceNameOrGetSourceNameFunc: string | Function = null) {
    if (!sourceNameOrGetSourceNameFunc) {
        return targetName
    }
    if (typeof sourceNameOrGetSourceNameFunc == 'string') {
        return sourceNameOrGetSourceNameFunc
    }
    return (sourceNameOrGetSourceNameFunc as Function)(targetName)
}