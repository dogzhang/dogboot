"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
/**
 * 指定此类为控制器
 * Controller是一种特殊的Component
 * @param path 映射到的路由，默认取类名前一部分，比如HomeController默认映射到/Home，Home也映射到/Home
 */
function Controller(path = null) {
    return function (target) {
        let $path = '';
        if (path == null) {
            $path = '/' + target.name.replace(/Controller$/i, '');
        }
        else {
            $path = path;
        }
        Reflect.defineMetadata('$isController', true, target.prototype);
        Reflect.defineMetadata('$path', $path, target.prototype);
        core_1.Utils.markAsComponent(target);
    };
}
exports.Controller = Controller;
//# sourceMappingURL=Component.js.map