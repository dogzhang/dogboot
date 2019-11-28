import { Component } from '../../../../bin/index';
import { MyService3 } from './MyService3';

@Component
export class MyService2 {
    constructor(private readonly myService3: MyService3) { }

    index() {
        return this.myService3.index()
    }
}