import { Controller, Autowired } from "./Component";
import { GetMapping } from "./Mapping";
import { DogBootApplication } from "./DogBootApplication";

@Controller()
export class APIDocController {
    @Autowired(() => DogBootApplication)
    private app: DogBootApplication

    @GetMapping('')
    index() {
        return '/apidoc'
    }

    @GetMapping()
    action() {
        return '/apidoc/action'
    }
}