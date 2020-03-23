import { IllegalActionArgumentException } from './IllegalActionArgumentException';
import { IllegalArgumentException } from './IllegalArgumentException';

/**
 * 指定此Array类型需要验证其确切类型
 */
export function Valid(target: any, name: string) {
    let $validator = Reflect.getMetadata('$validator', target) || {}
    $validator[name] = $validator[name] || []
    Reflect.defineMetadata('$validator', $validator, target)
}

/**
 * 用于自定义自己的验证器，所有dogboot内置验证器也是基于此来实现
 * @param func 验证规则
 */
export function Func(func: (arg0: any) => [boolean, string?]) {
    return function (target: any, name: string, index?: number) {
        if (index == null) {
            let $validator = Reflect.getMetadata('$validator', target) || {}
            $validator[name] = $validator[name] || []
            $validator[name].push((a: any) => {
                let result = func(a)
                if (!result[0]) {
                    throw new IllegalArgumentException(result[1], target.constructor.name, name)
                }
            })

            Reflect.defineMetadata('$validator', $validator, target)
        } else {
            let $paramValidators = Reflect.getMetadata('$paramValidators', target, name) || []
            $paramValidators[index] = $paramValidators[index] || []
            $paramValidators[index].push((a: any) => {
                let result = func(a)
                if (!result[0]) {
                    throw new IllegalActionArgumentException(result[1], target.constructor.name, name, index)
                }
            })
            Reflect.defineMetadata('$paramValidators', $paramValidators, target, name)
        }
    }
}

/**
 * a != null
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export function NotNull(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null) {
            return [true]
        }
        return [false, errorMesage]
    })
}

/**
 * a != null && a.length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export function NotEmpty(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null && a.length > 0) {
            return [true]
        }
        return [false, errorMesage]
    })
}

/**
 * a != null && a.trim().length > 0
 * @param errorMesage 错误消息，默认为：字段不能为空
 */
export function NotBlank(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null && a.trim().length > 0) {
            return [true]
        }
        return [false, errorMesage]
    })
}

/**
 * 长度验证器，只能用于String、Array的验证，对于String，不会trim
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小长度
 * @param max 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${max} | 字段长度必须大于或等于${min} | 字段长度必须介于${min} ~ ${max}
 */
export function Length(min: number, max: number, errorMesage: string = null) {
    if (errorMesage == null) {
        if (min == null) {
            errorMesage = `字段长度必须小于或等于${max}`
        } else if (max == null) {
            errorMesage = `字段长度必须大于或等于${min}`
        } else {
            if (min == max) {
                errorMesage = `字段长度必须等于${min}`
            } else {
                errorMesage = `字段长度必须介于${min} ~ ${max}`
            }
        }
    }

    return Func(a => {
        if (a == null) {
            return [true]
        }
        if ((min != null && a.length < min) || (max != null && a.length > max)) {
            return [false, errorMesage]
        }
        return [true]
    })
}

/**
 * 最小长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小长度
 * @param errorMesage 错误消息，默认为：字段长度必须大于或等于${length}
 */
export function MinLength(length: number, errorMesage: string = null) {
    return Length(length, null, errorMesage)
}

/**
 * 最大长度验证器，只能用于String、Array的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大长度
 * @param errorMesage 错误消息，默认为：字段长度必须小于或等于${length}
 */
export function MaxLength(length: number, errorMesage: string = null) {
    return Length(null, length, errorMesage)
}

/**
 * 数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小数值
 * @param max 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${max} | 字段值必须大于或等于${min} | 字段值必须介于${min} ~ ${max}
 */
export function Range(min: number, max: number, errorMesage: string = null) {
    if (errorMesage == null) {
        if (min == null) {
            errorMesage = `字段值必须小于或等于${max}`
        } else if (max == null) {
            errorMesage = `字段值必须大于或等于${min}`
        } else {
            if (min == max) {
                errorMesage = `字段值必须等于${min}`
            } else {
                errorMesage = `字段值必须介于${min} ~ ${max}`
            }
        }
    }

    return Func(a => {
        if (a == null) {
            return [true]
        }
        if ((min != null && a < min) || (max != null && a > max)) {
            return [false, errorMesage]
        }
        return [true]
    })
}

/**
 * 最小数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最小数值
 * @param errorMesage 错误消息，默认为：字段值必须大于或等于${val}
 */
export function Min(val: number, errorMesage: string = null) {
    return Range(val, null, errorMesage)
}

/**
 * 最大数值大小验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param val 最大数值
 * @param errorMesage 错误消息，默认为：字段值必须小于或等于${val}
 */
export function Max(val: number, errorMesage: string = null) {
    return Range(null, val, errorMesage)
}

/**
 * 小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param min 最小的小数位长度
 * @param max 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${max} | 小数点位数必须大于或等于${min} | 小数点位数必须介于${min} ~ ${max}
 */
export function Decimal(min: number, max: number, errorMesage: string = null) {
    if (errorMesage == null) {
        if (min == null) {
            errorMesage = `小数点位数必须小于或等于${max}`
        } else if (max == null) {
            errorMesage = `小数点位数必须大于或等于${min}`
        } else {
            if (min == max) {
                if (min == 0) {
                    errorMesage = `只能是整数`
                } else {
                    errorMesage = `小数点位数必须等于${min}`
                }
            } else {
                errorMesage = `小数点位数必须介于${min} ~ ${max}`
            }
        }
    }

    return Func(a => {
        if (a == null) {
            return [true]
        }
        let decimalPart = a.toString().split('.')[1] || ''
        if ((min != null && decimalPart.length < min) || (max != null && decimalPart.length > max)) {
            return [false, errorMesage]
        }
        return [true]
    })
}

/**
 * 最小小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最小的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须大于或等于${length}
 */
export function MinDecimal(length: number, errorMesage: string = null) {
    return Decimal(length, null, errorMesage)
}

/**
 * 最大小数位验证器，只能用于Number的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param length 最大的小数位长度
 * @param errorMesage 错误消息，默认为：小数点位数必须小于或等于${length}
 */
export function MaxDecimal(length: number, errorMesage: string = null) {
    return Decimal(null, length, errorMesage)
}

/**
 * 正则表达式验证器，只能用于String的验证
 * 不会对null值进行验证，如需同时验证null，请添加@NotNull
 * @param pattern 正则规则
 * @param errorMesage 错误消息，默认为：字段格式不符合要求
 */
export function Reg(pattern: RegExp, errorMesage: string = null) {
    errorMesage = errorMesage || '字段格式不符合要求'
    return Func(a => {
        if (a == null) {
            return [true]
        }
        if (!a.match(pattern)) {
            return [false, errorMesage]
        }
        return [true]
    })
}