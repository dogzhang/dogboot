import { MinLength, Typed } from '../../../../bin';

export class Index2IM {
    @MinLength(3)
    @Typed()
    name: string
}