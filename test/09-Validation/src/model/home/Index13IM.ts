import { Typed, Reg } from "../../../../../bin/lib/DogBoot";

export class Index13IM {
    @Reg(/^[a-z]+$/)
    @Typed()
    a: string
}