import { Typed, Length } from "../../../../../bin/index";

export class Index4IM {
    @Length(2, 4)
    @Typed()
    a: string
}