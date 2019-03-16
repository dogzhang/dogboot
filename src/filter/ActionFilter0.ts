import { ActionFilterContext, DoBefore, DoAfter, Component } from "../lib/DogBoot";

@Component
export class ActionFilter0 {

    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        console.log('doBefore0', actionFilterContext.controller.name, actionFilterContext.action)
    }

    @DoAfter
    doAfter(actionFilterContext: ActionFilterContext) {
        console.log('doAfter0', actionFilterContext.controller.name, actionFilterContext.action)
    }
}