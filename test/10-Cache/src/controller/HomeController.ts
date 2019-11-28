import {
    BindBody, BindQuery, Cachable, Controller, getCache, GetMapping, PostMapping
} from '../../../../bin/index';

@Controller()
export class HomeController {
    private id: number = 1

    @GetMapping('/index')
    index() {
        return this.id++
    }
}

@Controller()
export class Home1Controller {
    private id: number = 1

    @Cachable({ name: 'home.index' })
    @GetMapping('/index')
    index() {
        return this.id++
    }
}

@Controller()
export class Home2Controller {
    private id: number = 1

    @Cachable({ name: 'home.index', keys: [[0, '']] })
    @GetMapping('/index')
    index(@BindQuery('id') id: number) {
        return this.id++
    }
}

@Controller()
export class Home3Controller {
    private id: number = 1

    @Cachable({ keys: [[0, 'id']] })
    @PostMapping('/index')
    index(@BindBody bd: any) {
        return this.id++
    }
}

@Controller()
export class Home4Controller {
    private id: number = 1

    @Cachable({ keys: [[0, 'type.id']] })
    @PostMapping('/index')
    index(@BindBody bd: any) {
        return this.id++
    }
}

@Controller()
export class Home5Controller {
    private id: number = 1

    @Cachable({ keys: [[0, ''], [1, 'type']] })
    @PostMapping('/index')
    index(@BindQuery('id') id: number, @BindBody bd: any) {
        return this.id++
    }
}

@Controller()
export class Home6Controller {
    private id: number = 1

    @Cachable({ maxAge: 500 })
    @GetMapping('/index')
    index() {
        return this.id++
    }
}

@Controller()
export class Home7Controller {
    private id: number = 1

    @Cachable()
    @GetMapping('/index')
    index() {
        return this.id++
    }

    @GetMapping('/clear')
    clear() {
        getCache().deleteByNameAndKeys('Home7Controller:index', [])
        return 'ok'
    }
}