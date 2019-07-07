import { Typed, Length } from "../../../../../bin/lib/DogBoot";

export class Index4IM {
    @Length(2, 4)
    @Typed()
    a: string
}