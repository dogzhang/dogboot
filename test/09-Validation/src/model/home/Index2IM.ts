import { NotEmpty, Typed } from '../../../../../bin/index';

export class Index2IM {
    @NotEmpty()
    @Typed()
    a: string
}