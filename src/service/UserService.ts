import { Component, Autowired } from "../lib/DogBoot";
import { ItemService } from "./ItemService";

@Component()
export class UserService {

    constructor(){
        console.log('UserService', Math.random())
    }

    @Autowired(() => ItemService)
    itemService:ItemService
    index() {
        console.log('UserService')
    }
}