/**
 * 指定此Array类型需要验证其确切类型
 */
export declare function Valid(target: any, name: string): void;
/**
 * 用于自定义自己的验证器，所有dogboot内置验证器也是基于此来实现
 * @param func 验证规则
 */
export declare function Func(func: (arg0: any) => [boolean, string?]): (target: any, name: string) => void;
/**
 * a != null
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export declare function NotNull(errorMesage?: string): (target: any, name: string) => void;
/**
 * a != null && a.length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export declare function NotEmpty(errorMesage?: string): (target: any, name: string) => void;
/**
 * a != null && a.trim().length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export declare function NotBlank(errorMesage?: string): (target: any, name: string) => void;
/**
 * 长度验证器，只能用于String、Array的验证，对于String，不会trim
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小长度
 * @param max 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${max} | 字段长度必须大于或等于${min} | 字段长度必须介于${min} ~ ${max}
 */
export declare function Length(min: number, max: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最小长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小长度
 * @param errorMesage 错误消息，默认为：字段长度必须大于或等于${length}
 */
export declare function MinLength(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最大长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${length}
 */
export declare function MaxLength(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小数值
 * @param max 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${max} | 字段值必须大于或等于${min} | 字段值必须介于${min} ~ ${max}
 */
export declare function Range(min: number, max: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最小数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最小数值
 * @param errorMesage 错误消息，默认为：字段值必须大于或等于${val}
 */
export declare function Min(val: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最大数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${val}
 */
export declare function Max(val: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小的小数位长度
 * @param max 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${max} | 小数点位数必须大于或等于${min} | 小数点位数必须介于${min} ~ ${max}
 */
export declare function Decimal(min: number, max: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最小小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须大于或等于${length}
 */
export declare function MinDecimal(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 最大小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${length}
 */
export declare function MaxDecimal(length: number, errorMesage?: string): (target: any, name: string) => void;
/**
 * 正则表达式验证器，只能用于String的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param pattern 正则规则
 * @param errorMesage 错误消息，默认为：字段格式不符合要求
 */
export declare function Reg(pattern: RegExp, errorMesage?: string): (target: any, name: string) => void;
