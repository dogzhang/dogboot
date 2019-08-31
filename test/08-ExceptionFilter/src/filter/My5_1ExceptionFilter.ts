import { ExceptionHandler, ExceptionFilter } from "../../../../bin/index";

@ExceptionFilter
export class My5_1ExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(ctx: any, error: Error) {
        ctx.body = '5_1ExceptionFilter-' + error.message
    }
}