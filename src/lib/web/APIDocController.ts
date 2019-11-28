import { Autowired } from '../core';
import { Controller } from './Component';
import { DogBootApplication } from './DogBootApplication';
import { GetMapping } from './Mapping';

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