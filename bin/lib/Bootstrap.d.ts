import { DogBootApplication } from "./web/DogBootApplication";
import { CreateAppOptions } from "./CreateAppOptions";
/**
 * DogBoot创建应用的唯一入口
 */
export declare function createApp(opts?: number | CreateAppOptions): Promise<DogBootApplication>;
