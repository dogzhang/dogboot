import { NotBlank, Typed } from '../../../../../bin/index';

export class Index3IM {
    @NotBlank()
    @Typed()
    a: string
}