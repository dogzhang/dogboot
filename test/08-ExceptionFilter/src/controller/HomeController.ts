import { Controller, GetMapping, UseExceptionFilter, UseActionFilter } from "../../../../bin/index";
import { MyExceptionFilter } from "../filter/MyExceptionFilter";
import { MyActionFilter } from "../filter/MyActionFilter";
import { My4_0ExceptionFilter } from "../filter/My4_0ExceptionFilter";
import { My4_1ExceptionFilter } from "../filter/My4_1ExceptionFilter";
import { My5_0ExceptionFilter } from "../filter/My5_0ExceptionFilter";
import { My5_1ExceptionFilter } from "../filter/My5_1ExceptionFilter";

@Controller()
export class HomeController {
    @GetMapping()
    async index() {
        throw new Error('error')
    }
}

@UseExceptionFilter(MyExceptionFilter)
@Controller()
export class Home1Controller {
    @GetMapping()
    async index() {
        throw new Error('error')
    }
}

@Controller()
export class Home2Controller {
    @UseExceptionFilter(MyExceptionFilter)
    @GetMapping()
    async index() {
        throw new Error('error')
    }
}

@UseActionFilter(MyActionFilter)
@Controller()
export class Home3Controller {
    @UseExceptionFilter(MyExceptionFilter)
    @GetMapping()
    async index() {
        return 'ok'
    }
}

@Controller()
export class Home4Controller {
    @UseExceptionFilter(My4_0ExceptionFilter)
    @UseExceptionFilter(My4_1ExceptionFilter)
    @GetMapping()
    async index() {
        throw new Error('error')
    }
}

@UseExceptionFilter(My5_0ExceptionFilter)
@UseExceptionFilter(My5_1ExceptionFilter)
@Controller()
export class Home5Controller {
    @GetMapping()
    async index() {
        throw new Error('error')
    }
}