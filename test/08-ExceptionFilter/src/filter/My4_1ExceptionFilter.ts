import { ExceptionHandler, ExceptionFilter } from "../../../../bin/index";

@ExceptionFilter
export class My4_1ExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(ctx: any, error: Error) {
        ctx.body = '4_1ExceptionFilter-' + error.message
    }
}