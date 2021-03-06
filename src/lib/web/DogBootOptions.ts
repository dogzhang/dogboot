import { Config, Typed } from '../core';
import { CorsOptions } from './CorsOptions';

@Config({ field: 'app' })
export class DogBootOptions {
    @Typed()
    port?: number = 3000

    @Typed()
    prefix?: string = ''

    /**
     * 是否允许跨域
     */
    @Typed()
    enableCors?: boolean = false

    /**
     * 跨域选项，dogboot使用koa2-cors这个包实现跨域，参见https://github.com/zadzbw/koa2-cors
     */
    @Typed()
    corsOptions?: CorsOptions = new CorsOptions()
}