import { Context } from "koa";
import { JsonResultUtil } from "../common/JsonResultUtil";
import { ExceptionFilter, ExceptionHandler } from "../lib/DogBoot";
import { UnauthenticatedException } from "../exception/UnauthenticatedException";

@ExceptionFilter()
export class MyExceptionFilter {
    @ExceptionHandler(UnauthenticatedException)
    async handleUnauthenticatedException(error: UnauthenticatedException, ctx: Context) {
        ctx.body = JsonResultUtil.alertFail(error.message)
    }

    @ExceptionHandler(Error)
    async handleError(error: Error, ctx: Context) {
        ctx.body = JsonResultUtil.alertFail(error.message)
    }
}