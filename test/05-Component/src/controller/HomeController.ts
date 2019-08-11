import { Controller, GetMapping, DogBootApplication, DIContainer } from "../../../../bin/index";
import { MyService1 } from "../component/MyService1";
import { MyService4 } from "../component/MyService4";
import { MyService2 } from "../component/MyService2";
import { MyService6 } from "../component/MyService6";
import { MyService7 } from "../component/MyService7";
import { MyService8 } from "../component/MyService8";
import { MyService9 } from "../component/MyService9";

@Controller('/home')
export class HomeController {
    constructor(private readonly myService1: MyService1) { }

    @GetMapping('/index')
    async index() {
        return this.myService1.index()
    }
}

@Controller()
export class Home1Controller {
    constructor(private readonly myService1: MyService1, private readonly myService2: MyService1) { }

    @GetMapping('/index')
    async index() {
        return this.myService1 == this.myService2 ? 1 : 0
    }
}

@Controller()
export class Home2Controller {
    constructor(private readonly myService2: MyService2) { }

    @GetMapping('/index')
    async index() {
        return this.myService2.index()
    }
}

@Controller()
export class Home3Controller {
    constructor(private readonly myService4: MyService4) { }

    @GetMapping('/index')
    async index() {
        return this.myService4.index()
    }
}

@Controller()
export class Home4Controller {
    constructor(private readonly myService6: MyService6) { }

    @GetMapping('/index')
    async index() {
        return this.myService6.index()
    }
}

@Controller()
export class Home5Controller {
    constructor(private readonly myService7: MyService7) { }

    @GetMapping('/index')
    async index() {
        return this.myService7.index()
    }
}

@Controller()
export class Home6Controller {
    constructor(private readonly myService8: MyService8) { }

    @GetMapping('/index')
    async index() {
        return this.myService8.index()
    }
}

@Controller()
export class Home7Controller {
    constructor(private readonly myService9: MyService9) { }

    @GetMapping('/index')
    async index() {
        return this.myService9.index()
    }
}

@Controller()
export class Home8Controller {
    constructor(private readonly app: DogBootApplication) { }

    @GetMapping('/index')
    async index() {
        return (this.app as any).__proto__.constructor.name
    }
}

@Controller()
export class Home9Controller {
    constructor(private readonly container: DIContainer) { }

    @GetMapping('/index')
    async index() {
        return (this.container as any).__proto__.constructor.name
    }
}