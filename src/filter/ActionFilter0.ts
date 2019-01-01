import { ActionFilterContext, ActionFilter, DoBefore, DoAfter } from "../lib/DogBoot";

@ActionFilter()
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