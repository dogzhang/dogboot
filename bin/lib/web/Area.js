"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Area {
    /**
     * 表示controller下的一个目录
     * @param dirPath 此目录的绝对文件路径，比如：/root/web/dogboot-demo/controller/app
     * @param areaPath 相对于controller的文件路径，比如：/app/v1
     */
    constructor(dirPath, areaPath) {
        this.dirPath = dirPath;
        this.areaPath = areaPath;
        /**
         * 此area下的所有控制器类
         */
        this.controllerList = [];
        /**
         * 此area包含的所有子area
         */
        this.subAreaList = [];
    }
}
exports.Area = Area;
//# sourceMappingURL=Area.js.map