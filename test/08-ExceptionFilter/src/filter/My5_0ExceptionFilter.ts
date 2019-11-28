import { ExceptionFilter, ExceptionHandler } from '../../../../bin/index';

@ExceptionFilter
export class My5_0ExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(ctx: any, error: Error) {
        ctx.body = '5_0ExceptionFilter-' + error.message
    }
}