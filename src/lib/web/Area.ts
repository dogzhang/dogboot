export class Area {
    /**
     * 表示controller下的一个目录
     * @param dirPath 此目录的绝对文件路径，比如：/root/web/dogboot-demo/controller/app
     * @param areaPath 相对于controller的文件路径，比如：/app/v1
     */
    constructor(readonly dirPath: string, readonly areaPath: string) { }

    /**
     * 此area下的所有控制器类
     */
    controllerList: (new (...args: any[]) => {})[] = []

    /**
     * 此area包含的所有子area
     */
    subAreaList: Area[] = []
}