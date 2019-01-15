import { StartUp, Init } from "../lib/DogBoot";

@StartUp()
export class StartUpService1 {
    @Init
    private async Init() {
        await new Promise<void>(resolve => {
            setTimeout(function () {
                console.log(1)
                resolve()
            }, 1000)
        })
        await new Promise<void>(resolve => {
            setTimeout(function () {
                console.log(2)
                resolve()
            }, 1000)
        })
    }
}