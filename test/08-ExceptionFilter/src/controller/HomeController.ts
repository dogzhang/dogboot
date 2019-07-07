import { Controller, GetMapping, UseExceptionFilter, UseActionFilter } from "../../../../bin/lib/DogBoot";
import { MyExceptionFilter } from "../filter/MyExceptionFilter";
import { MyActionFilter } from "../filter/MyActionFilter";

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