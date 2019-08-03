import { DoBefore, ActionFilterContext, ActionFilter } from "../../../../bin/index";

@ActionFilter
export class MyActionFilter {
    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        let ticket = actionFilterContext.ctx.get('ticket')
        //请求的header中的ticket不能为空，且需要包含admin
        if (!ticket || !ticket.includes('admin')) {
            throw new UnAuthorizedException()
        }
    }
}

export class UnAuthorizedException extends Error {
}