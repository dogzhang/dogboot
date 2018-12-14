import { TypeSpecified, MinLength } from "../../lib/DogBoot";

export class Email {
    @TypeSpecified
    id: number

    @TypeSpecified
    @MinLength(12)
    title: string

    @TypeSpecified
    content: string
}