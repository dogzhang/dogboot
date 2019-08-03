import { Utils } from "../core/Utils";

/**
 * 指定此类为控制器
 * Controller是一种特殊的Component
 * @param path 映射到的路由，默认取类名前一部分，比如HomeController默认映射到/Home，Home也映射到/Home
 */
export function Controller(path: string = null) {
    return function (target: new (...args: any[]) => {}) {
        if (path == null) {
            target.prototype.$path = '/' + target.name.replace(/Controller$/i, '')
        } else {
            target.prototype.$path = path
        }
        target.prototype.$isController = true
        Utils.markAsComponent(target)
    }
}