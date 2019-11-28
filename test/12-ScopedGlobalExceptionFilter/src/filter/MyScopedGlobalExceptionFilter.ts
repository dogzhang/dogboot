import { ExceptionHandler, GlobalExceptionFilter } from '../../../../bin/index';

@GlobalExceptionFilter({ scope: '/home' })
export class MyGlobalExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(ctx: any, error: Error) {
        ctx.body = error.message
    }
}