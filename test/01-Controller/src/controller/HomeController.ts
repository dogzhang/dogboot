import { Controller, GetMapping } from '../../../../bin/index';

@Controller('/home')
export class HomeController {
    @GetMapping('/index')
    index() {
        return 'ok'
    }
}

export class Home1Controller {
    @GetMapping('/index')
    index() {
        return 'ok'
    }
}

@Controller()
export class Home2Controller {
    @GetMapping('/index')
    index() {
        return 'ok'
    }
}