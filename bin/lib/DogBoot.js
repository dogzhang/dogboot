"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
let { Module } = require("module");
let oldLoadFunc = Module.prototype.load;
Module.prototype.load = function (filename) {
    oldLoadFunc.call(this, filename);
    try {
        for (let p in this.exports) {
            let field = this.exports[p];
            if (field.prototype.$isComponent) {
                field.prototype.$filename = filename;
            }
        }
    }
    catch (_a) { }
};
__export(require("./ActionFilterContext"));
__export(require("./Bind"));
__export(require("./Bootstrap"));
__export(require("./Component"));
__export(require("./DIContainer"));
__export(require("./DogBootApplication"));
__export(require("./DogUtils"));
__export(require("./IllegalArgumentException"));
__export(require("./LazyResult"));
__export(require("./Mapping"));
__export(require("./NotFoundException"));
__export(require("./TypeConvert"));
__export(require("./Validation"));
//# sourceMappingURL=DogBoot.js.map