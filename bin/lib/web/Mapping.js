"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 映射此方法为Action
 * @param type method类型，默认为get
 * @param path 映射到的路由，默认为action名称
 */
function Mapping(type = 'get', path = null) {
    return function (target, name) {
        let action = target[name];
        action.$method = type.toLowerCase();
        if (path == null) {
            action.$path = '/' + action.name;
        }
        else {
            action.$path = path;
        }
        action.$paramTypes = Reflect.getMetadata('design:paramtypes', target, name);
    };
}
exports.Mapping = Mapping;
/**
 * 映射此方法为Action，允许所有类型的method请求
 * @param path 映射到的路由，默认为action名称
 */
function AllMapping(path = null) {
    return Mapping('all', path);
}
exports.AllMapping = AllMapping;
/**
 * 映射此方法为Action，只允许get请求
 * @param path 映射到的路由，默认为action名称
 */
function GetMapping(path = null) {
    return Mapping('get', path);
}
exports.GetMapping = GetMapping;
/**
 * 映射此方法为Action，只允许post请求
 * @param path 映射到的路由，默认为action名称
 */
function PostMapping(path = null) {
    return Mapping('post', path);
}
exports.PostMapping = PostMapping;
/**
 * 映射此方法为Action，只允许put请求
 * @param path 映射到的路由，默认为action名称
 */
function PutMapping(path = null) {
    return Mapping('put', path);
}
exports.PutMapping = PutMapping;
/**
 * 映射此方法为Action，只允许patch请求
 * @param path 映射到的路由，默认为action名称
 */
function PatchMapping(path = null) {
    return Mapping('patch', path);
}
exports.PatchMapping = PatchMapping;
/**
 * 映射此方法为Action，只允许delete请求
 * @param path 映射到的路由，默认为action名称
 */
function DeleteMapping(path = null) {
    return Mapping('delete', path);
}
exports.DeleteMapping = DeleteMapping;
/**
 * 映射此方法为Action，只允许head请求
 * @param path 映射到的路由，默认为action名称
 */
function HeadMapping(path = null) {
    return Mapping('head', path);
}
exports.HeadMapping = HeadMapping;
//# sourceMappingURL=Mapping.js.map