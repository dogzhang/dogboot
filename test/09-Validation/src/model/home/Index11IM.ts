import { Typed, MinDecimal } from "../../../../../bin/lib/DogBoot";

export class Index11IM {
    @MinDecimal(2)
    @Typed()
    a: number
}