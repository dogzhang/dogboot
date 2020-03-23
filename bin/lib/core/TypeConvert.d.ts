/**
 * 指定此字段需要转换为指定类型，仅仅支持Number、String、Date
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export declare function Typed(sourceNameOrGetSourceNameFunc?: string | ((targetName: string) => string)): (target: any, name: string) => void;
/**
 * 指定此Array字段的确切类型需要转换为指定类型
 * @param type 确切类型
 * @param sourceNameOrGetSourceNameFunc 映射的原始字段或者映射规则，默认为此字段名字
 */
export declare function TypedArray(type: Function, sourceNameOrGetSourceNameFunc?: string | ((targetName: string) => string)): (target: any, name: string) => void;
