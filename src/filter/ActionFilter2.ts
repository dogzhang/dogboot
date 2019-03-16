import { ActionFilterContext, DoBefore, DoAfter, Component } from "../lib/DogBoot";

@Component
export class ActionFilter2 {

    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        console.log('doBefore2', actionFilterContext.controller.name, actionFilterContext.action)
    }

    @DoAfter
    doAfter(actionFilterContext: ActionFilterContext) {
        console.log('doAfter2', actionFilterContext.controller.name, actionFilterContext.action)
    }
}