import { ActionFilterContext, DoBefore, GlobalActionFilter } from '../../../../bin/index';

@GlobalActionFilter({ scope: '/home1' })
export class MyGlobalActionFilter {
    @DoBefore
    doBefore(actionFilterContext: ActionFilterContext) {
        actionFilterContext.ctx.body = 'MyGlobalActionFilter'
    }
}