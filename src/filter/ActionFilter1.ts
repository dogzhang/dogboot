import { ActionFilterContext, ActionFilter, DoBefore, DoAfter } from "../lib/DogBoot";

@ActionFilter()
export class ActionFilter1 {

    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        console.log('doBefore1', actionFilterContext.controller.name, actionFilterContext.action)
    }

    @DoAfter
    doAfter(actionFilterContext: ActionFilterContext) {
        console.log('doAfter1', actionFilterContext.controller.name, actionFilterContext.action)
    }
}