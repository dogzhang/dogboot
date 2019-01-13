import { Field, FieldArray, Range, MinLength, Max, Valid, NotNull, Underscore } from "../../lib/DogBoot";
import { School } from "./School";
import { Email } from "./Email";

export class SendIM {
    @Field()
    @NotNull()
    id: number

    @Field()
    name: string

    @Field(Underscore)
    nickName: string

    @Field()
    age: number

    @Field()
    birth: Date

    @Field('online1')
    online: boolean

    @Field()
    school: School

    @FieldArray(Email)
    @Valid
    emails: Email[]
}