import { ActionFilterContext, ActionFilter, DoBefore, DoAfter } from "../lib/DogBoot";

@ActionFilter()
export class ActionFilter4 {

    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        console.log('doBefore4', actionFilterContext.controller.name, actionFilterContext.action)
    }

    @DoAfter
    doAfter(actionFilterContext: ActionFilterContext) {
        console.log('doAfter4', actionFilterContext.controller.name, actionFilterContext.action)
    }
}