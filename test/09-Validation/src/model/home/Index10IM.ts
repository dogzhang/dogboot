import { Typed, Decimal } from "../../../../../bin/lib/DogBoot";

export class Index10IM {
    @Decimal(2, 4)
    @Typed()
    a: number
}