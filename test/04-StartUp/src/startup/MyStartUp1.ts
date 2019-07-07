import { StartUp, Init } from "../../../../bin/lib/DogBoot";

@StartUp(1)
export class MyStartUp1 {
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