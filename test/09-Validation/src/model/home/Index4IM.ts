import { Length, Typed } from '../../../../../bin/index';

export class Index4IM {
    @Length(2, 4)
    @Typed()
    a: string
}