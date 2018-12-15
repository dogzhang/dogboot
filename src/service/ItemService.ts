import { Component, Autowired } from "../lib/DogBoot";
import { UserService } from "./UserService";

@Component()
export class ItemService {

    constructor() {
        console.log('ItemService', Math.random())
    }

    @Autowired(() => UserService)
    userService: UserService;
    index() {
        console.log('ItemService')
    }

    async init() {
        await new Promise<void>(resolve => {
            setTimeout(function () {
                resolve()
            }, 3000)
        })
        console.log('init')
    }
}