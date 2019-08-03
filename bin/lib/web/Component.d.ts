/**
 * 指定此类为控制器
 * Controller是一种特殊的Component
 * @param path 映射到的路由，默认取类名前一部分，比如HomeController默认映射到/Home，Home也映射到/Home
 */
export declare function Controller(path?: string): (target: new (...args: any[]) => {}) => void;
