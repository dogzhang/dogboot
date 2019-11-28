import { MaxLength, Typed } from '../../../../../bin/index';

export class Index6IM {
    @MaxLength(4)
    @Typed()
    a: string
}