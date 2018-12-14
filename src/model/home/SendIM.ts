import { TypeSpecified, TypeSpecifiedArray, Range, MinLength, Max, Valid, NotNull } from "../../lib/DogBoot";
import { School } from "./School";
import { Email } from "./Email";

export class SendIM {
    @TypeSpecified
    @NotNull()
    id: number

    @TypeSpecified
    name: string

    @TypeSpecified
    age: number

    @TypeSpecified
    birth: Date

    @TypeSpecified
    online: boolean

    @TypeSpecified
    school: School

    @TypeSpecifiedArray(Email)
    @Valid
    emails: Email[]
}