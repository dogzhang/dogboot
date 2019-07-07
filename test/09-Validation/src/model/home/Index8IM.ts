import { Typed, Min } from "../../../../../bin/lib/DogBoot";

export class Index8IM {
    @Min(2)
    @Typed()
    a: number
}