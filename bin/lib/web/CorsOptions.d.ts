/**
 * 跨域选项，dogboot使用koa2-cors这个包实现跨域，参见https://github.com/zadzbw/koa2-cors
 */
export declare class CorsOptions {
    origin?: string;
    exposeHeaders?: string[];
    maxAge?: number;
    credentials?: boolean;
    allowMethods?: string[];
    allowHeaders?: string[];
}
