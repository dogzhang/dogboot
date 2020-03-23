import { CorsOptions } from './CorsOptions';
export declare class DogBootOptions {
    port?: number;
    prefix?: string;
    /**
     * 是否允许跨域
     */
    enableCors?: boolean;
    /**
     * 跨域选项，dogboot使用koa2-cors这个包实现跨域，参见https://github.com/zadzbw/koa2-cors
     */
    corsOptions?: CorsOptions;
}
