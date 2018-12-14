import { Context } from "koa";
import { JsonResultUtil } from "../common/JsonResultUtil";
import { ExceptionFilter } from "../lib/DogBoot";

@ExceptionFilter()
export class MyExceptionFilter {
    do(err: Error, ctx: Context) {
        console.log(ctx.query)
        ctx.body = JsonResultUtil.alertFail(err.message)
    }
}