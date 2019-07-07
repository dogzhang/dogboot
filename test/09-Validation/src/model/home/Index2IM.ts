import { Typed, NotEmpty } from "../../../../../bin/lib/DogBoot";

export class Index2IM {
    @NotEmpty()
    @Typed()
    a: string
}