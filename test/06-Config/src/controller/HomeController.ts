import { Controller, GetMapping, Config, Typed, TypedArray } from "../../../../bin/lib/DogBoot";

@Config()
class MyConfig {
    a: string
}

@Controller('/home')
export class HomeController {
    constructor(private readonly myConfig: MyConfig) { }

    @GetMapping('/index')
    async index() {
        return this.myConfig.a
    }
}

@Config({ field: 'field' })
class MyConfig1 {
    a: string
}

@Controller()
export class Home1Controller {
    constructor(private readonly myConfig1: MyConfig1) { }

    @GetMapping('/index')
    async index() {
        return this.myConfig1.a
    }
}

@Config()
class MyConfig2 {
    arrayField: string[]
}

@Controller()
export class Home2Controller {
    constructor(private readonly myConfig2: MyConfig2) { }

    @GetMapping('/index')
    async index() {
        return this.myConfig2.arrayField[0]
    }
}

@Config()
class MyConfig3 {
    a: string

    field: MyConfig3_1

    arrayField: string[]
}

class MyConfig3_1 {
    a: string
}

@Controller()
export class Home3Controller {
    constructor(private readonly myConfig3: MyConfig3) { }

    @GetMapping('/index')
    async index() {
        return this.myConfig3.field.a
    }
}

@Config()
class MyConfig4 {
    a: string

    field: MyConfig4_1

    arrayField: string[]

    arrayFieldObject: MyConfig4_1[]
}

class MyConfig4_1 {
    a: string
}

@Controller()
export class Home4Controller {
    constructor(private readonly myConfig4: MyConfig4) { }

    @GetMapping('/index')
    async index() {
        return this.myConfig4.arrayFieldObject[0].a
    }
}

@Config()
class MyConfig5 {
    @Typed()
    a: number
}

@Controller()
export class Home5Controller {
    constructor(private readonly myConfig5: MyConfig5) { }

    @GetMapping('/index')
    async index() {
        return typeof this.myConfig5.a === 'number' ? 1 : 0
    }
}

@Config()
class MyConfig6 {
    a: string

    @TypedArray(Number)
    arrayField: number[]
}

@Controller()
export class Home6Controller {
    constructor(private readonly myConfig6: MyConfig6) { }

    @GetMapping('/index')
    async index() {
        return typeof this.myConfig6.arrayField[0] === 'number' ? 1 : 0
    }
}