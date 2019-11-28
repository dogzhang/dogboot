import { Min, Typed } from '../../../../../bin/index';

export class Index8IM {
    @Min(2)
    @Typed()
    a: number
}