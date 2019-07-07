import { Controller, GetMapping, UseActionFilter } from "../../../../bin/lib/DogBoot";
import { MyActionFilter } from "../filter/MyActionFilter";

@Controller()
export class HomeController {
    @GetMapping()
    index() {
        return 'ok'
    }
}

@UseActionFilter(MyActionFilter)
@Controller()
export class Home1Controller {
    @GetMapping()
    index() {
        return 'ok'
    }

    @GetMapping()
    index1() {
        return 'ok'
    }
}

@Controller()
export class Home2Controller {
    @UseActionFilter(MyActionFilter)
    @GetMapping()
    index() {
        return 'ok'
    }

    @GetMapping()
    index1() {
        return 'ok'
    }
}