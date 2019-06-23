import { Controller, GetMapping } from "dogboot";

@Controller('/home')
export class HomeController {
    @GetMapping('/index')
    async index() {
        return 'ok'
    }
}