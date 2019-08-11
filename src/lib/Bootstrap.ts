import { DogBootApplication } from "./web/DogBootApplication";
import { CreateAppOptions } from "./CreateAppOptions";

/**
 * DogBoot创建应用的唯一入口
 */
export async function createApp(opts?: number | CreateAppOptions) {
    let _opts: CreateAppOptions = {}
    if (opts != null) {
        if (typeof opts === 'number') {
            _opts = {
                port: opts as number
            }
        } else {
            _opts = opts as CreateAppOptions
        }
    }

    if (_opts.port != null) {
        process.env.dogPort = _opts.port.toString()
    }
    if (_opts.entry != null) {
        process.env.dogEntry = _opts.entry
    }
    return new DogBootApplication().runAsync()
}