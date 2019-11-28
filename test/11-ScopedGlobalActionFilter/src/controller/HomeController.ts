import { Controller, GetMapping, UseActionFilter, UseExceptionFilter } from '../../../../bin/index';

@Controller()
export class HomeController {
    @GetMapping()
    async index() {
        return 'ok'
    }
}

@Controller()
export class Home1Controller {
    @GetMapping()
    async index() {
        return 'ok'
    }
}