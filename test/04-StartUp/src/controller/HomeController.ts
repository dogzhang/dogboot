import { Controller, GetMapping } from '../../../../bin/index';
import { MyStartUp } from '../startup/MyStartUp';
import { MyStartUp1 } from '../startup/MyStartUp1';
import { MyStartUp2 } from '../startup/MyStartUp2';

@Controller()
export class HomeController {
    constructor(private myStartUp: MyStartUp) { }

    @GetMapping()
    index() {
        return this.myStartUp.a
    }
}

@Controller()
export class Home1Controller {
    constructor(private myStartUp1: MyStartUp1, private myStartUp2: MyStartUp2) { }

    @GetMapping()
    index() {
        return this.myStartUp2.a - this.myStartUp1.a
    }
}