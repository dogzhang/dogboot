import Koa = require('koa');
import {
    BindBody, BindContext, BindHeader, BindPath, BindQuery, BindRequest, BindResponse, Controller,
    GetMapping, PostMapping
} from '../../../../bin/index';

@Controller()
export class HomeController {
    @GetMapping('/index')
    index(@BindQuery('a') a: string) {
        return a
    }

    @GetMapping('/index1/:a/b')
    index1(@BindPath('a') a: string) {
        return a
    }

    @PostMapping()
    index2(@BindBody im: any) {
        return im.a
    }

    @GetMapping()
    index3(@BindContext ctx: Koa.Context) {
        return ctx.query.a
    }

    @GetMapping()
    index4(@BindRequest req: Koa.Request) {
        return req.query.a
    }

    @GetMapping()
    index5(@BindResponse res: Koa.Response) {
        res.body = 1
    }

    @GetMapping()
    index6(@BindHeader('ticket') ticket: string) {
        return ticket
    }
}