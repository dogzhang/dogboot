import { Component, Init } from "../../../../bin/lib/DogBoot";

@Component
export class MyService9 {
    a: string

    constructor() {
        this.a = 'I will not be show.'
    }

    @Init
    private init() {
        this.a = 'ok'
    }

    index() {
        return this.a
    }
}