import { Typed, TypedArray, Range, MinLength, Max, Valid, NotNull, Underscore } from "../../lib/DogBoot";
import { School } from "./School";
import { Email } from "./Email";

export class SendIM {
    @Typed()
    @NotNull()
    id: number

    @Typed()
    name: string

    @Typed(Underscore)
    nickName: string

    @Typed()
    age: number

    @Typed()
    birth: Date

    @Typed('online1')
    online: boolean

    @Typed()
    school: School

    @TypedArray(Email)
    @Valid
    emails: Email[]
}