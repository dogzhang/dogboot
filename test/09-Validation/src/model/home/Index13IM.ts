import { Reg, Typed } from '../../../../../bin/index';

export class Index13IM {
    @Reg(/^[a-z]+$/)
    @Typed()
    a: string
}