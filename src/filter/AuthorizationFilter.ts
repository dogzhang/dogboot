import { ActionFilterContext, Autowired, ActionFilter } from "../lib/DogBoot";
import { UserService } from "../service/UserService";
import { ItemService } from "../service/ItemService";

@ActionFilter()
export class AuthorizationFilter {
    constructor(private userService: UserService) {
    }

    @Autowired(ItemService)
    itemService: ItemService

    do(actionFilterContext: ActionFilterContext) {
        console.log(actionFilterContext.controller.name, actionFilterContext.action)
    }
}