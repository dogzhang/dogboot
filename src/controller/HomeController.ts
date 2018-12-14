import { Controller, GetMapping, PostMapping, ViewResult, Autowired, BindContext, BindQuery, BindBody, BindPath, Config, DoBefore, HandleException } from "../lib/DogBoot";
import { Context } from "koa";
import { HomeService } from "../service/HomeService";
import { JsonResultUtil } from "../common/JsonResultUtil";
import { ItemService } from "../service/ItemService";
import { SendIM } from "../model/home/SendIM";
import { AuthorizationFilter } from "../filter/AuthorizationFilter";
import { MyExceptionFilter } from "../filter/MyExceptionFilter";

@Controller('/home')
@HandleException(MyExceptionFilter)
export class HomeController {
    constructor(private homeService: HomeService) {
        console.log('HomeController', Math.random())
    }

    @Config('password', String)
    password: string

    @GetMapping('/index/:id')
    @DoBefore(AuthorizationFilter)
    async index(@BindQuery('a') a: number, @BindPath('id') id: Date, @BindContext ctx: Context) {
        ctx.body = this.password
    }

    @PostMapping('/send')
    async send(@BindBody im: SendIM, @BindQuery('a') a: number, @BindContext ctx: Context) {
        return JsonResultUtil.ok(im)
    }

    @Autowired(ItemService)
    itemService: ItemService

    @GetMapping('/view')
    async view() {
        this.itemService.index()
        return new ViewResult({ name: 'zhang' })
    }
}