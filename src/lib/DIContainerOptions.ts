import { Config } from "./Component";
import { Typed } from "./TypeConvert";

@Config({ field: 'app' })
export class DIContainerOptions {
    @Typed()
    enableHotload?: boolean = false
    /**
     * 热更新监听文件变化的debounce，单位：毫秒，默认1000
     */
    @Typed()
    hotloadDebounceInterval?: number = 1000
}