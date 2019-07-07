import { Typed, MinLength } from "../../../../../bin/lib/DogBoot";

export class Index5IM {
    @MinLength(2)
    @Typed()
    a: string
}