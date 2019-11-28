import Koa = require('koa');
import { ExceptionHandler, GlobalExceptionFilter, IllegalArgumentException } from '../../../../bin';

@GlobalExceptionFilter()
export class MyExceptionFilter {
    @ExceptionHandler(IllegalArgumentException)
    handlerIllegalArgumentException(ctx: Koa.Context, error: IllegalArgumentException) {
        ctx.status = 500
        ctx.body = 'IllegalArgumentException'
    }
}