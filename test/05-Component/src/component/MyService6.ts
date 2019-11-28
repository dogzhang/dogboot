import { Component, Init } from '../../../../bin/index';

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