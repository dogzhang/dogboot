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

export * from './ActionFilterContext'
export * from './Bind'
export * from './Bootstrap'
export * from './Component'
export * from './DIContainer'
export * from './DogBootApplication'
export * from './DogUtils'
export * from './IllegalArgumentException'
export * from './LazyResult'
export * from './Mapping'
export * from './NotFoundException'
export * from './TypeConvert'
export * from './Validation'