import { Controller, GetMapping, PostMapping, BindBody } from "../../../../bin/lib/DogBoot";
import { Index1IM } from "../model/home/Index1IM";
import { Index2IM } from "../model/home/Index2IM";
import { Index3IM } from "../model/home/Index3IM";
import { Index4IM } from "../model/home/Index4IM";
import { Index5IM } from "../model/home/Index5IM";
import { Index6IM } from "../model/home/Index6IM";
import { Index7IM } from "../model/home/Index7IM";
import { Index8IM } from "../model/home/Index8IM";
import { Index9IM } from "../model/home/Index9IM";
import { Index10IM } from "../model/home/Index10IM";
import { Index11IM } from "../model/home/Index11IM";
import { Index12IM } from "../model/home/Index12IM";
import { Index13IM } from "../model/home/Index13IM";
import { Index14IM } from "../model/home/Index14IM";

@Controller()
export class HomeController {
    @PostMapping()
    async index1(@BindBody im: Index1IM) {
        return 'ok'
    }

    @PostMapping()
    async index2(@BindBody im: Index2IM) {
        return 'ok'
    }

    @PostMapping()
    async index3(@BindBody im: Index3IM) {
        return 'ok'
    }

    @PostMapping()
    async index4(@BindBody im: Index4IM) {
        return 'ok'
    }

    @PostMapping()
    async index5(@BindBody im: Index5IM) {
        return 'ok'
    }

    @PostMapping()
    async index6(@BindBody im: Index6IM) {
        return 'ok'
    }

    @PostMapping()
    async index7(@BindBody im: Index7IM) {
        return 'ok'
    }

    @PostMapping()
    async index8(@BindBody im: Index8IM) {
        return 'ok'
    }

    @PostMapping()
    async index9(@BindBody im: Index9IM) {
        return 'ok'
    }

    @PostMapping()
    async index10(@BindBody im: Index10IM) {
        return 'ok'
    }

    @PostMapping()
    async index11(@BindBody im: Index11IM) {
        return 'ok'
    }

    @PostMapping()
    async index12(@BindBody im: Index12IM) {
        return 'ok'
    }

    @PostMapping()
    async index13(@BindBody im: Index13IM) {
        return 'ok'
    }

    @PostMapping()
    async index14(@BindBody im: Index14IM) {
        return 'ok'
    }
}