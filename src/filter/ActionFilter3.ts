import { ActionFilterContext, DoBefore, DoAfter, Component } from "../lib/DogBoot";

@Component
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