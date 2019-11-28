import { ExceptionHandler, GlobalExceptionFilter } from '../../../../bin/index';

@GlobalExceptionFilter()
export class MyGlobalExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(ctx: any, error: Error) {
        ctx.body = error.message
    }
}