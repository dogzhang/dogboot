import { StartUp } from "../../../../bin/lib/DogBoot";

@StartUp()
export class MyStartUp {
    a: string

    constructor() {
        this.a = 'ok'
    }
}