import Koa = require('koa');
import {
    ExceptionHandler, GlobalExceptionFilter, IllegalActionArgumentException,
    IllegalArgumentException
} from '../../../../bin';

@GlobalExceptionFilter()
export class MyExceptionFilter {
    @ExceptionHandler(IllegalArgumentException)
    handlerIllegalArgumentException(ctx: Koa.Context, error: IllegalArgumentException) {
        ctx.status = 500
        ctx.body = 'IllegalArgumentException'
    }

    @ExceptionHandler(IllegalActionArgumentException)
    handlerIllegalActionArgumentException(ctx: Koa.Context, error: IllegalActionArgumentException) {
        ctx.status = 500
        ctx.body = error.message
    }
}