import { Controller, Mapping } from "../../../../../bin/index";

@Controller()
export class HomeController {
    @Mapping()
    index() {
        return 'ok'
    }
}