import { Typed, MinLength } from "../../../../../bin/index";

export class Index5IM {
    @MinLength(2)
    @Typed()
    a: string
}