import { Controller, BindQuery, PostMapping, BindBody, GetMapping, ViewResult } from "../../lib/DogBoot";
import { JsonResultUtil } from "../../common/JsonResultUtil";
import { SendIM } from "../../model/home/SendIM";

@Controller()
export class AreaController {
    @GetMapping()
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