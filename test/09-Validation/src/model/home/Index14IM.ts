import { Typed, Func } from "../../../../../bin/lib/DogBoot";

export class Index14IM {
    @Func((a: string) => {
        if (a == null) {
            return [true]
        }
        return [a.includes('admin')]
    })
    @Typed()
    a: string
}