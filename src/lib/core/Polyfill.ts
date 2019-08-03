import 'reflect-metadata'
let { Module } = require("module");

let oldLoadFunc = Module.prototype.load
Module.prototype.load = function (filename: string) {
    oldLoadFunc.call(this, filename)
    try {
        for (let p in this.exports) {
            let field = this.exports[p]
            if (field.prototype.$isComponent) {
                field.prototype.$filename = filename
            }
        }
    } catch{ }
}