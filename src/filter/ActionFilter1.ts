import { ActionFilterContext, DoBefore, DoAfter, Component } from "../lib/DogBoot";

@Component
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