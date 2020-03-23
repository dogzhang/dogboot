import { Decimal, Typed } from '../../../../../bin/index';

export class Index10IM {
    @Decimal(2, 4)
    @Typed()
    a: number
}