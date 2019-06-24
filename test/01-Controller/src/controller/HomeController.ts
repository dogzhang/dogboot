import { Controller, GetMapping } from "../../../../bin/lib/DogBoot";

@Controller('/home')
export class HomeController {
    @GetMapping('/index')
    async index() {
        return 'ok'
    }
}

@Controller('')
export class Home1Controller {
    @GetMapping('')
    async index() {
        return 'root'
    }
}