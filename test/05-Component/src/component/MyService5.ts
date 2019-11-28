import { Autowired, Component } from '../../../../bin/index';
import { MyService4 } from './MyService4';

@Component
export class MyService5 {
    @Autowired(() => MyService4)
    myService4: MyService4

    index() {
        return 'ok'
    }

    index1() {
        return this.myService4.index1()
    }
}