import { BindBody, Controller, PostMapping } from '../../../../bin/index';
import { Index1IM } from '../model/Index1IM';
import { Index2IM } from '../model/Index2IM';

@Controller()
export class HomeController {
    @PostMapping()
    index(@BindBody im: any) {
        return im.name
    }

    @PostMapping()
    index1(@BindBody im: Index1IM) {
        return im.name
    }

    @PostMapping()
    index2(@BindBody im: Index2IM) {
        return im.name
    }
}