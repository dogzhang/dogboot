import fs = require('fs');
import path = require('path');
import Koa = require('koa');
import Router = require('koa-router');
import koaBody = require('koa-body');
import koaStatic = require('koa-static');
import cors = require('koa2-cors')
import { Server } from 'http';
import http = require('http');
import { DoBefore, DoAfter } from '../core/Component';
import { Utils } from '../core/Utils';
import { DogUtils } from '../core/DogUtils';
import { DIContainer } from '../core/DIContainer';
import { DogBootOptions } from './DogBootOptions';
import { ActionFilterContext } from './ActionFilterContext';
import { LazyResult } from './LazyResult';
import { APIDocController } from './APIDocController';
import { NotFoundException } from './NotFoundException';
import { Area } from './Area';

export class DogBootApplication {
    app = new Koa()
    server: Server

    area: Area

    private globalExceptionFilters: (new (...args: any[]) => {})[]
    private globalActionFilters: (new (...args: any[]) => {})[]
    private requestHandler: Function
    private opts: DogBootOptions
    private container: DIContainer

    constructor() {
        this.opts = Utils.getConfigValue(DogBootOptions)[0]

        this.container = new DIContainer()
        this.container.on('reload', () => {
            this.reload()
        })
    }

    private build() {
        let publicRootPath = path.join(Utils.getAppRootPath(), this.opts.staticRootPathName)
        this.app.use(koaStatic(publicRootPath))
        this.app.use(koaBody())

        if (this.opts.enableCors) {
            this.app.use(cors(this.opts.corsOptions))
        }

        let controllerRootPath = path.join(Utils.getExecRootPath(), this.opts.controllerRootPathName)
        this.area = new Area(controllerRootPath, '/')
        this.checkControllerDir(this.area)
    }

    private checkControllerDir(area: Area) {
        let list = fs.readdirSync(area.dirPath)
        list.forEach(a => {
            let filePath = path.join(area.dirPath, a)
            let fileState = fs.statSync(filePath)
            if (fileState.isFile()) {
                let _Module = Utils.tryRequire(filePath)
                _Module && Object.values(_Module).filter(b => b instanceof Function && b.prototype.$isController)
                    .forEach((b: new (...args: any[]) => {}) => {
                        area.controllerList.push(b)
                        this.checkControllerClass(area.areaPath, b)
                    })
            } else if (fileState.isDirectory()) {
                let areaPath = (area.areaPath + '/' + a).replace(/^\/\//, '/')
                let subArea = new Area(filePath, areaPath)
                area.subAreaList.push(subArea)
                this.checkControllerDir(subArea)
            }
        })
    }

    private checkControllerClass(areaPath: string, _Class: new (...args: any[]) => {}) {
        let router = new Router({
            prefix: this.opts.prefix + (areaPath == '/' ? '' : areaPath) + _Class.prototype.$path
        })
        Object.getOwnPropertyNames(_Class.prototype).forEach(a => {
            this.checkAndHandleActionName(a, _Class, router, areaPath)
        })
        this.app.use(router.routes())
    }

    private checkAndHandleActionName(actionName: string, _Class: new (...args: any[]) => {}, router: Router<any, {}>, areaPath: string) {
        let _prototype = _Class.prototype
        let action = _prototype[actionName]
        if (!action.$method) {
            return
        }
        router[action.$method](action.$path, async (ctx: Koa.Context) => {
            try {
                await this.handleContext(actionName, _Class, ctx)
            } catch (err) {
                let filtersOnController = _prototype.$exceptionFilters || []
                let filtersOnAction = _prototype[actionName].$exceptionFilters || []
                let filters = this.globalExceptionFilters.concat(filtersOnController, filtersOnAction).reverse()

                let [exceptionFilter, handlerName] = this.getExceptionHandlerName(err.__proto__.constructor, areaPath, filters)
                if (!handlerName) {
                    [exceptionFilter, handlerName] = this.getExceptionHandlerName(Error, areaPath, filters)
                }
                if (!handlerName) {
                    throw err
                }
                await this.handlerException(exceptionFilter, handlerName, err, ctx)
            }
        })
    }

    private async handleContext(actionName: string, _Class: new (...args: any[]) => {}, ctx: Koa.Context) {
        let _prototype = _Class.prototype
        let instance = await this.container.getComponentInstanceFromFactory(_prototype.constructor)
        let $params = instance[actionName].$params || []//使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
        let $paramTypes: Function[] = instance[actionName].$paramTypes || []//全部的参数类型
        let params = $params.map((b: Function, idx: number) => {
            let originalValArr = b(ctx)
            let originalVal = originalValArr[0]
            let typeSpecified = originalValArr[1]
            let toType = $paramTypes[idx]
            if (typeSpecified && toType) {
                return DogUtils.getTypeSpecifiedValue(toType, originalVal)
            } else {
                return originalVal
            }
        })
        for (let b of params) {
            Utils.validateModel(b)
        }
        let actionFilterContext = new ActionFilterContext(ctx, params, $paramTypes, _Class, actionName)

        let filtersOnController = _prototype.$actionFilters || []
        let filtersOnAction = instance[actionName].$actionFilters || []
        let filters = this.globalActionFilters.concat(filtersOnController, filtersOnAction)
        let filterAndInstances: [new (...args: any[]) => {}, any][] = []
        for (let filter of filters) {
            let filterInstance = await this.container.getComponentInstanceFromFactory(filter)
            filterAndInstances.push([filter, filterInstance])

            let handlerName = filter.prototype.$actionHandlerMap.get(DoBefore)
            if (!handlerName) {
                continue
            }
            await filterInstance[handlerName](actionFilterContext)
            if (ctx.status != 404) {
                break
            }
        }

        if (ctx.status == 404) {
            let body = await instance[actionName](...params)
            if (ctx.status == 404) {
                if (body instanceof LazyResult) {
                    ctx.state.LazyResult = body
                } else {
                    ctx.body = body
                }
            }
        }

        for (let [filter, filterInstance] of filterAndInstances.reverse()) {
            let handlerName = filter.prototype.$actionHandlerMap.get(DoAfter)
            if (!handlerName) {
                continue
            }
            await filterInstance[handlerName](actionFilterContext)
        }
    }

    private getExceptionHandlerName(exceptionType: new (...args: any[]) => {}, area: string, filters: (new (...args: any[]) => {})[]): [(new (...args: any[]) => {})?, string?] {
        for (let a of filters) {
            if (a.prototype.$isGlobalExceptionFilter && !area.startsWith(a.prototype.$area)) {
                continue
            }
            let handlerName = a.prototype.$exceptionHandlerMap.get(exceptionType)
            if (handlerName) {
                return [a, handlerName]
            }
        }
        return []
    }

    private async handlerException(exceptionFilter: new (...args: any[]) => {}, handlerName: string, err: any, ctx: Koa.Context) {
        let exceptionFilterInstance = await this.container.getComponentInstanceFromFactory(exceptionFilter)
        await exceptionFilterInstance[handlerName](ctx, err)
    }

    private async startUp() {
        let startupRootPath = path.join(Utils.getExecRootPath(), this.opts.startupRootPathName)
        if (!fs.existsSync(startupRootPath)) {
            return
        }
        let startUpFileList = Utils.getAllFileListInDir(startupRootPath)
        let startUpClassList = []
        for (let filePath of startUpFileList) {
            let _Module = Utils.tryRequire(filePath)
            _Module && Object.values(_Module).forEach(a => {
                if (a instanceof Function) {
                    startUpClassList.push(a)
                }
            })
        }
        startUpClassList = startUpClassList.filter(a => a.prototype.$isStartUp).sort((a, b) => b.prototype.$order - a.prototype.$order)
        for (let startUp of startUpClassList) {
            await this.container.getComponentInstanceFromFactory(startUp)
        }
    }

    private async initControllers(area: Area) {
        for (let controllerClass of area.controllerList) {
            await this.container.getComponentInstanceFromFactory(controllerClass)
        }
        for (let subArea of area.subAreaList) {
            await this.initControllers(subArea)
        }
    }

    private async initFilters() {
        let filterRootPath = path.join(Utils.getExecRootPath(), this.opts.filterRootPathName)
        if (!fs.existsSync(filterRootPath)) {
            return
        }
        let filterFileList = Utils.getAllFileListInDir(filterRootPath)
        let filterClassList = []
        for (let filePath of filterFileList) {
            let _Module = Utils.tryRequire(filePath)
            _Module && Object.values(_Module).forEach(a => {
                if (a instanceof Function) {
                    filterClassList.push(a)
                }
            })
        }
        this.globalActionFilters = filterClassList.filter(a => a.prototype.$isGlobalActionFilter).sort((a, b) => b.prototype.$order - a.prototype.$order)
        this.globalExceptionFilters = filterClassList.filter(a => a.prototype.$isGlobalExceptionFilter)
        for (let filter of this.globalActionFilters) {
            await this.container.getComponentInstanceFromFactory(filter)
        }
        for (let filter of this.globalExceptionFilters) {
            await this.container.getComponentInstanceFromFactory(filter)
        }
    }

    private buildApidoc() {
        if (!this.opts.enableApidoc) {
            return
        }
        this.checkControllerClass('', APIDocController)
    }

    private useNotFoundExceptionHandler() {
        this.app.use(async ctx => {
            let [exceptionFilter, handlerName] = this.getExceptionHandlerName(NotFoundException, '/', this.globalExceptionFilters)
            if (!handlerName) {
                return
            }
            await this.handlerException(exceptionFilter, handlerName, new NotFoundException(), ctx)
        })
    }

    /**
     * 主动热更新程序
     */
    reload() {
        this.container.clear()
        return this.runAsync()
    }

    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    async runAsync() {
        let startTime = Date.now()

        this.globalExceptionFilters = []
        this.globalActionFilters = []
        this.requestHandler = null

        this.container.setComponentInstance(DogBootApplication, this)
        this.container.setComponentInstance(DIContainer, this.container)

        this.app.middleware = []
        this.build()
        this.buildApidoc()
        this.useNotFoundExceptionHandler()
        this.requestHandler = this.app.callback()

        let port = this.opts.port
        if (process.env.dogPort) {
            port = Number.parseInt(process.env.dogPort)
        }

        let lastServer = this.server
        if (!lastServer) {
            this.server = http.createServer((req, res) => {
                this.requestHandler(req, res)
            })
        } else {
            this.server.close()
        }

        await this.startUp()
        await this.initControllers(this.area)
        await this.initFilters()

        this.server.listen(port)

        let endTime = Date.now()
        console.log(`Your application has ${lastServer ? 'reloaded' : 'started'} at ${port} in ${endTime - startTime}ms`)

        await this.test()

        return this
    }

    private async test() {
        if (!this.opts.enableTest) {
            return
        }

        console.log('Running tests...')
        let startTime = Date.now()

        let testRootPath = path.join(Utils.getExecRootPath(), this.opts.testRootPathName)
        let testFileList = Utils.getAllFileListInDir(testRootPath)
        let testClassList: (new (...args: any[]) => {})[] = []
        for (let testFile of testFileList) {
            try {
                let _Module = Utils.tryRequire(testFile)
                _Module && Object.values(_Module).filter(b => b instanceof Function && b.prototype.$isTest)
                    .forEach((b: new (...args: any[]) => {}) => {
                        testClassList.push(b)
                    })
            } catch (error) { }
        }

        let passed = 0
        let faild = 0
        let total = 0
        for (let _Class of testClassList) {
            let _prototype = _Class.prototype
            let testInstance = await this.container.getComponentInstanceFromFactory(_Class)
            for (let testMethod of _prototype.$testMethods) {
                try {
                    await testInstance[testMethod]()
                    passed += 1
                } catch (error) {
                    console.error(`Test faild at ${_Class.name}.${testMethod}`)
                    console.trace(error.stack)
                    faild += 1
                } finally {
                    total += 1
                }
            }
        }

        let endTime = Date.now()
        console.log(`All tests ran in ${endTime - startTime}ms`)
        console.table([{ passed, faild, total }])
    }
}