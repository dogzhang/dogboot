import { GlobalActionFilter, DoBefore, ActionFilterContext } from "../../../../bin/index";

@GlobalActionFilter()
export class MyGlobalActionFilter {
    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        let ticket = actionFilterContext.ctx.get('ticket')
        //请求的header中的ticket不能为空，且需要包含admin
        if (!ticket || !ticket.includes('admin')) {
            actionFilterContext.ctx.throw(401)
        }
    }
}