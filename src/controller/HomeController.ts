import { Controller, GetMapping, PostMapping, ViewResult, BindQuery, BindBody, UseActionFilter } from "../lib/DogBoot";
import { JsonResultUtil } from "../common/JsonResultUtil";
import { SendIM } from "../model/home/SendIM";
import { ActionFilter2 } from "../filter/ActionFilter2";
import { ActionFilter3 } from "../filter/ActionFilter3";
import { ActionFilter4 } from "../filter/ActionFilter4";
import { ActionFilter5 } from "../filter/ActionFilter5";

@Controller('/home')
@UseActionFilter(ActionFilter2)
@UseActionFilter(ActionFilter3)
export class HomeController {
    @GetMapping('/index')
    @UseActionFilter(ActionFilter4)
    @UseActionFilter(ActionFilter5)
    async index(@BindQuery('a') a: number) {
        console.log('执行/home/index')
        return JsonResultUtil.ok(a)
    }

    @PostMapping('/send')
    async send(@BindBody im: SendIM) {
        return JsonResultUtil.ok(im)
    }

    @GetMapping('/view')
    async view() {
        return new ViewResult({ name: 'zhang' })
    }
}