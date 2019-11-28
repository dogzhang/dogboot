import { Component, Init } from '../../../../bin/index';

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