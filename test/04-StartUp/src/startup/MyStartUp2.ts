import { StartUp, Init } from "../../../../bin/lib/DogBoot";

@StartUp(2)
export class MyStartUp2 {
    a: number

    @Init
    private init() {
        this.a = Date.now()
        return new Promise(resolve => {
            setTimeout(function () {
                resolve()
            }, 100)
        })
    }
}