import { Controller, GetMapping, UseActionFilter, UseExceptionFilter } from '../../../../bin/index';

@Controller()
export class HomeController {
    @GetMapping()
    async index() {
        throw new Error('error')
    }
}

@Controller()
export class Home1Controller {
    @GetMapping()
    async index() {
        throw new Error('error')
    }
}