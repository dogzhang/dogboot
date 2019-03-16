import { Typed, TypedArray, Max } from "../../lib/DogBoot";
import { Email } from "./Email";

export class School {
    @Typed()
    @Max(0)
    id: number

    @Typed()
    name: string

    @TypedArray(Email)
    emails: Email[]
}