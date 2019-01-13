import { Field, FieldArray, Max } from "../../lib/DogBoot";
import { Email } from "./Email";

export class School {
    @Field()
    @Max(0)
    id: number

    @Field()
    name: string

    @FieldArray(Email)
    emails: Email[]
}