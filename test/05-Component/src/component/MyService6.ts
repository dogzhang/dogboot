import { Component, Init } from "../../../../bin/lib/DogBoot";

@Component
export class MyService6 {
    a: string

    constructor() {
        this.a = 'ok'
    }

    index() {
        return this.a
    }
}