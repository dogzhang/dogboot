import { Component, Init } from "../../../../bin/index";

@Component
export class MyService8 {
    a: string

    @Init
    private async init() {
        this.a = await Promise.resolve('ok')
    }

    index() {
        return this.a
    }
}