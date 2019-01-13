import { Field, MinLength } from "../../lib/DogBoot";

export class Email {
    @Field()
    id: number

    @Field()
    @MinLength(12)
    title: string

    @Field()
    content: string
}