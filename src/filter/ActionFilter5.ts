import { ActionFilterContext, ActionFilter, DoBefore, DoAfter } from "../lib/DogBoot";
import { RedisKeyConfig } from "../common/config/RedisKeyConfig";

@ActionFilter()
export class ActionFilter5 {
    constructor(private readonly redisKeyConfig: RedisKeyConfig) { }

    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        console.log(this.redisKeyConfig)
        console.log('doBefore5', actionFilterContext.controller.name, actionFilterContext.action)
    }

    @DoAfter
    doAfter(actionFilterContext: ActionFilterContext) {
        console.log('doAfter5', actionFilterContext.controller.name, actionFilterContext.action)
    }
}