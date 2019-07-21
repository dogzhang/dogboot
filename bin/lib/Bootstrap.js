"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DIContainer_1 = require("./DIContainer");
const DogBootApplication_1 = require("./DogBootApplication");
/**
 * DogBoot创建应用的唯一入口
 */
function createApp(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        let _opts = {};
        if (opts != null) {
            if (typeof opts === 'number') {
                _opts = {
                    port: opts
                };
            }
            else {
                _opts = opts;
            }
        }
        if (_opts.port != null) {
            process.env.dogbootPort = _opts.port.toString();
        }
        if (_opts.entry != null) {
            process.env.dogbootEntry = _opts.entry;
        }
        let container = new DIContainer_1.DIContainer();
        yield container.init();
        return container.getComponentInstanceFromFactory(DogBootApplication_1.DogBootApplication);
    });
}
exports.createApp = createApp;
//# sourceMappingURL=Bootstrap.js.map