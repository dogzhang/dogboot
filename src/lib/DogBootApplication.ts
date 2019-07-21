import fs = require('fs');
import path = require('path');
import Koa = require('koa');
import Router = require('koa-router');
import koaBody = require('koa-body');
import koaStatic = require('koa-static');
import cors = require('koa2-cors')
import { Server } from 'http';
import http = require('http');
import { Component, DoBefore, DoAfter, Init } from "./Component";
import { DogBootOptions } from './DogBootOptions';
import { Utils } from './Utils';
import { DogUtils } from './DogUtils';
import { ActionFilterContext } from './ActionFilterContext';
import { DIContainer } from './DIContainer';
import { LazyResult } from './LazyResult';
import { APIDocController } from './APIDocController';
import { NotFoundException } from './NotFoundException';

@Component
export class DogBootApplication {
    app = new Koa()
    server: Server

    controllerClasses: (new (...args: any[]) => {})[]

    private readyToAcceptRequest: boolean
    private globalExceptionFilter: new (...args: any[]) => {}
    private globalActionFilters: (new (...args: any[]) => {})[]
    private requestHandler: Function

    constructor(private readonly opts: DogBootOptions, private readonly container: DIContainer) {
        this.container.on('reload', () => {
            this.container.setComponentInstance(DogBootApplication, this)
            this.init()
        })
    }

    @Init
    private async init() {
        this.readyToAcceptRequest = false
        this.globalExceptionFilter = null
        this.globalActionFilters = []
        this.requestHandler = null
        this.controllerClasses = []

        await this.runAsync()
    }

    private build() {
        let publicRootPath = path.join(Utils.getAppRootPath(), this.opts.staticRootPathName)
        this.app.use(koaStatic(publicRootPath))
        this.app.use(koaBody())

        if (this.opts.enableCors) {
            this.app.use(cors(this.opts.corsOptions))
        }

        let controllerRootPath = path.join(Utils.getExecRootPath(), this.opts.controllerRootPathName)
        let spiltStr = '/'
        if (process.platform == 'win32') {
            spiltStr = '\\'
        }
        Utils.getFileListInFolder(controllerRootPath).forEach(a => {
            let classDir = path.resolve(a, '..')
            let areaPrefix = path.relative(controllerRootPath, classDir).split(spiltStr).filter(b => b).join('/')
            if (areaPrefix) {
                areaPrefix = '/' + areaPrefix
            }
            let _Module = require(a)
            Object.values(_Module).filter(b => b instanceof Function && b.prototype.$isController)
                .forEach((b: new (...args: any[]) => {}) => {
                    this.checkControllerClass(areaPrefix, b)
                    this.controllerClasses.push(b)
                })
        })
    }

    private checkControllerClass(areaPrefix: string, _Class: new (...args: any[]) => {}) {
        let prefix = areaPrefix + _Class.prototype.$path
        let router = new Router()
        Object.getOwnPropertyNames(_Class.prototype).forEach(c => {
            this.checkAndHandleActionName(c, _Class, router, prefix)
        })
        if (this.opts.prefix) {
            router.prefix(this.opts.prefix)
        }
        this.app.use(router.routes())
    }

    private checkAndHandleActionName(actionName: string, _Class: new (...args: any[]) => {}, router: Router<any, {}>, prefix: string) {
        let _prototype = _Class.prototype
        let action = _prototype[actionName]
        if (!action.$method) {
            return
        }
        router[action.$method](prefix + action.$path, async (ctx: Koa.Context) => {
            while (!this.readyToAcceptRequest) {
                await Utils.sleep(200)
            }
            try {
                await this.handleContext(actionName, _Class, ctx)
            } catch (err) {
                let exceptionFilter = _prototype[actionName].$exceptionFilter || _prototype.$exceptionFilter || this.globalExceptionFilter
                let handlerName = this.getExceptionHandlerName(exceptionFilter, err.__proto__.constructor)
                if (!handlerName) {
                    handlerName = this.getExceptionHandlerName(exceptionFilter, Error)
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

        let actionFiltersOnController = _prototype.$actionFilters || []
        let actionFiltersOnAction = instance[actionName].$actionFilters || []
        let actionFilters = this.globalActionFilters.concat(actionFiltersOnController, actionFiltersOnAction)
        let actionFilterAndInstances: [Function, any][] = []
        for (let actionFilter of actionFilters) {
            let filterInstance = await this.container.getComponentInstanceFromFactory(actionFilter)
            actionFilterAndInstances.push([actionFilter, filterInstance])

            let handlerName = actionFilter.prototype.$actionHandlerMap.get(DoBefore)
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

        for (let [actionFilter, filterInstance] of actionFilterAndInstances.reverse()) {
            let handlerName = actionFilter.prototype.$actionHandlerMap.get(DoAfter)
            if (!handlerName) {
                continue
            }
            await filterInstance[handlerName](actionFilterContext)
        }
    }

    private getExceptionHandlerName(exceptionFilter: new (...args: any[]) => {}, exceptionType: new (...args: any[]) => {}): string {
        if (!exceptionFilter) {
            return null
        }
        if (!exceptionFilter.prototype.$exceptionHandlerMap) {
            return null
        }
        let handlerName = exceptionFilter.prototype.$exceptionHandlerMap.get(exceptionType)
        if (!handlerName) {
            return null
        }
        return handlerName
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
        let startUpFileList = Utils.getFileListInFolder(startupRootPath)
        let startUpClassList = []
        for (let filePath of startUpFileList) {
            let _Module = require(filePath)
            Object.values(_Module).forEach(a => {
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

    private async initComponents() {
        for (let componentClass of this.controllerClasses) {
            await this.container.getComponentInstanceFromFactory(componentClass)
        }
    }

    private async initFilters() {
        let filterRootPath = path.join(Utils.getExecRootPath(), this.opts.filterRootPathName)
        if (!fs.existsSync(filterRootPath)) {
            return
        }
        let filterFileList = Utils.getFileListInFolder(filterRootPath)
        let filterClassList = []
        for (let filePath of filterFileList) {
            let _Module = require(filePath)
            Object.values(_Module).forEach(a => {
                if (a instanceof Function) {
                    filterClassList.push(a)
                }
            })
        }
        this.globalActionFilters = filterClassList.filter(a => a.prototype.$isGlobalActionFilter).sort((a, b) => b.prototype.$order - a.prototype.$order)
        this.globalExceptionFilter = filterClassList.find(a => a.prototype.$isGlobalExceptionFilter)
        for (let filter of this.globalActionFilters) {
            await this.container.getComponentInstanceFromFactory(filter)
        }
        if (this.globalExceptionFilter) {
            await this.container.getComponentInstanceFromFactory(this.globalExceptionFilter)
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
            let exceptionFilter = this.globalExceptionFilter
            let handlerName = this.getExceptionHandlerName(exceptionFilter, NotFoundException)
            if (!handlerName) {
                return
            }
            await this.handlerException(exceptionFilter, handlerName, new NotFoundException(), ctx)
        })
    }

    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    private async runAsync() {
        let startTime = Date.now()
        this.app.middleware = []
        this.build()
        this.buildApidoc()
        this.useNotFoundExceptionHandler()
        this.requestHandler = this.app.callback()

        let port = this.opts.port
        if (process.env.dogbootPort) {
            port = Number.parseInt(process.env.dogbootPort)
        }

        let lastServer = this.server
        if (!lastServer) {
            this.server = http.createServer((req, res) => {
                this.requestHandler(req, res)
            }).listen(port)
        }

        await this.startUp()
        await this.initComponents()
        await this.initFilters()
        this.readyToAcceptRequest = true
        let endTime = Date.now()
        console.log(`Your application has ${lastServer ? 'reloaded' : 'started'} at ${port} in ${endTime - startTime}ms`)
    }
}