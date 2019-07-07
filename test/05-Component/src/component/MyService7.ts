import { Component, Init } from "../../../../bin/lib/DogBoot";

@Component
export class MyService7 {
    a: string

    @Init
    private init() {
        this.a = 'ok'
    }

    index() {
        return this.a
    }
}