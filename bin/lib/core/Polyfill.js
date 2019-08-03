"use strict";
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
//# sourceMappingURL=Polyfill.js.map