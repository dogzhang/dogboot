import { TypeSpecifiedType } from "./TypeSpecifiedType";

export class TypeSpecifiedMap {
    constructor(readonly typeSpecifiedType: TypeSpecifiedType, readonly type: Function, readonly sourceName: string, readonly targetName: string) { }
}