import { ExceptionHandler, ExceptionFilter } from "../../../../bin/lib/DogBoot";
import { UnAuthorizedException } from "./MyActionFilter";

@ExceptionFilter
export class MyExceptionFilter {
    @ExceptionHandler(UnAuthorizedException)
    async handleUnAuthorizedException(error: UnAuthorizedException, ctx: any) {
        ctx.throw(401)
    }

    @ExceptionHandler(Error)
    async handleError(error: Error, ctx: any) {
        ctx.body = 'ExceptionFilter-' + error.message
    }
}