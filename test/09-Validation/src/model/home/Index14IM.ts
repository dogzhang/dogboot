import { Typed, Func } from "../../../../../bin/index";

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