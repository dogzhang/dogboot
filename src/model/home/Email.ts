import { Typed, MinLength } from "../../lib/DogBoot";

export class Email {
    @Typed()
    id: number

    @Typed()
    @MinLength(12)
    title: string

    @Typed()
    content: string
}