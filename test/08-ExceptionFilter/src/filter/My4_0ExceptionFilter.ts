import { ExceptionHandler, ExceptionFilter } from "../../../../bin/index";

@ExceptionFilter
export class My4_0ExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(ctx: any, error: Error) {
        ctx.body = '4_0ExceptionFilter-' + error.message
    }
}