import { ActionFilterContext, ActionFilter, DoBefore, DoAfter } from "../lib/DogBoot";

@ActionFilter()
export class ActionFilter5 {

    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        console.log('doBefore5', actionFilterContext.controller.name, actionFilterContext.action)
    }

    @DoAfter
    doAfter(actionFilterContext: ActionFilterContext) {
        console.log('doAfter5', actionFilterContext.controller.name, actionFilterContext.action)
    }
}