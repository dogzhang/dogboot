import { Component, Autowired, ServiceContainer } from "../lib/DogBoot";
import { ItemService } from "./ItemService";

@Component()
export class UserService {

    constructor(private readonly serviceContainer: ServiceContainer) {
        console.log(serviceContainer.getService<number>('asd'))
        console.log('UserService', Math.random())
    }

    @Autowired(() => ItemService)
    itemService: ItemService
    index() {
        console.log('UserService')
    }
}