import { Typed, NotEmpty } from "../../../../../bin/index";

export class Index2IM {
    @NotEmpty()
    @Typed()
    a: string
}