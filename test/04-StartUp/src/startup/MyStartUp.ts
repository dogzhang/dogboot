import { StartUp } from '../../../../bin/index';

@StartUp()
export class MyStartUp {
    a: string

    constructor() {
        this.a = 'ok'
    }
}