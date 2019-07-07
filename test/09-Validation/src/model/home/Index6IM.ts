import { Typed, MaxLength } from "../../../../../bin/lib/DogBoot";

export class Index6IM {
    @MaxLength(4)
    @Typed()
    a: string
}