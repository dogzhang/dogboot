import { Controller, GetMapping } from "../../../../bin/lib/DogBoot";

@Controller('/home')
export class HomeController {
    @GetMapping('/index')
    async index() {
        return 'ok'
    }
}