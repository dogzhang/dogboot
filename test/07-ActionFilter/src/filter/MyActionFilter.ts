import { ActionFilter, ActionFilterContext, DoBefore } from '../../../../bin/index';

@ActionFilter
export class MyActionFilter {
    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        let ticket = actionFilterContext.ctx.get('ticket')
        //请求的header中的ticket不能为空，且需要包含admin1
        if (!ticket || !ticket.includes('admin1')) {
            actionFilterContext.ctx.throw(401)
        }
    }
}