import { Controller, Mapping } from "../../../../../bin/lib/DogBoot";

@Controller()
export class HomeController {
    @Mapping()
    index() {
        return 'ok'
    }
}