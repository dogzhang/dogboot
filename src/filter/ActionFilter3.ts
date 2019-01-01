import { ActionFilterContext, ActionFilter, DoBefore, DoAfter } from "../lib/DogBoot";

@ActionFilter()
export class ActionFilter3 {

    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        console.log('doBefore3', actionFilterContext.controller.name, actionFilterContext.action)
    }

    @DoAfter
    doAfter(actionFilterContext: ActionFilterContext) {
        console.log('doAfter3', actionFilterContext.controller.name, actionFilterContext.action)
    }
}