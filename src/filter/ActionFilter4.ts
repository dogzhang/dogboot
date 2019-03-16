import { ActionFilterContext, DoBefore, DoAfter, Component } from "../lib/DogBoot";

@Component
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