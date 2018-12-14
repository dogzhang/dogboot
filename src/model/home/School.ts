import { TypeSpecified, TypeSpecifiedArray, Max } from "../../lib/DogBoot";
import { Email } from "./Email";

export class School {
    @TypeSpecified
    @Max(0)
    id: number

    @TypeSpecified
    name: string

    @TypeSpecifiedArray(Email)
    emails: Email[]
}