import { TypeSpecifiedType } from './TypeSpecifiedType';
export declare class TypeSpecifiedMap {
    readonly typeSpecifiedType: TypeSpecifiedType;
    readonly type: Function;
    readonly sourceName: string;
    readonly targetName: string;
    constructor(typeSpecifiedType: TypeSpecifiedType, type: Function, sourceName: string, targetName: string);
}
