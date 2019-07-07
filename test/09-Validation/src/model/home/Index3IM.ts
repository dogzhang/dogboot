import { Typed, NotBlank } from "../../../../../bin/lib/DogBoot";

export class Index3IM {
    @NotBlank()
    @Typed()
    a: string
}