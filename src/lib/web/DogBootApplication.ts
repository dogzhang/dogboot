import path = require('path');
import Koa = require('koa');
import Router = require('koa-router');
import koaBody = require('koa-body');
import koaStatic = require('koa-static');
import cors = require('koa2-cors')
import { Server } from 'http';

import { DIContainer, DoAfter, DoBefore, Init, InnerCachable, StartUp, Utils } from '../core';
import { ActionFilterContext } from './ActionFilterContext';
import { DogBootOptions } from './DogBootOptions';
import { LazyResult } from './LazyResult';
import { NotFoundException } from './NotFoundException';

@StartUp()
export class DogBootApplication {
    app = new Koa()
    server: Server

    constructor(
        private readonly opts: DogBootOptions,
        private readonly container: DIContainer
    ) {
    }

    @Init
    async init() {
        this.build()
        this.useNotFoundExceptionHandler()

        let port = this.opts.port
        if (process.env.dogPort) {
            port = Number.parseInt(process.env.dogPort)
        }

        this.server = this.app.listen(port)

        await this.initControllers()
        await this.initFilters()

        let endTime = Date.now()
        let nowStr = Utils.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
        console.log(`[${nowStr}] Your application has started at ${port} in ${endTime - this.container.startTime}ms`)

        return this
    }

    private build() {
        let publicRootPath = path.join(Utils.getAppRootPath(), 'public')
        this.app.use(koaStatic(publicRootPath))
        this.app.use(koaBody({
            jsonLimit: 100 * 1024 * 1024,
            multipart: true,
            formidable: {
                maxFileSize: 100 * 1024 * 1024
            }
        }))

        if (this.opts.enableCors) {
            this.app.use(cors(this.opts.corsOptions))
        }

        let controllerList = this.container.getComponentsByTag('$isController')
        for (let controllerClass of controllerList) {
            this.checkControllerClass(controllerClass)
        }
    }

    private checkControllerClass(_Class: new (...args: any[]) => {}) {
        let router = new Router({
            prefix: this.opts.prefix + Reflect.getMetadata('$path', _Class.prototype)
        })
        Object.getOwnPropertyNames(_Class.prototype).forEach(a => {
            this.checkAndHandleActionName(a, _Class, router)
        })
        this.app.use(router.routes())
    }

    private checkAndHandleActionName(actionName: string, _Class: new (...args: any[]) => {}, router: Router<any, {}>) {
        let _prototype = _Class.prototype
        let $method = Reflect.getMetadata('$method', _prototype, actionName)
        let $path = Reflect.getMetadata('$path', _prototype, actionName)
        if (!$method) {
            return
        }
        router[$method]($path, async (ctx: Koa.Context) => {
            try {
                await this.handleContext(actionName, _Class, ctx)
            } catch (err) {
                let [exceptionFilter, handlerName] = this.getExceptionFilterAndHandlerName(_prototype, actionName, err.constructor, ctx.path)
                if (!handlerName) {
                    throw err
                }
                await this.handlerException(exceptionFilter, handlerName, err, ctx)
            }
        })
    }

    @InnerCachable({ keys: [[0, ''], [1, ''], [2, ''], [3, '']] })
    private getExceptionFilterAndHandlerName(_prototype: any, actionName: string, errConstructor: any, ctxPath: string): [new (...args: any[]) => {}, string] {
        let filtersOnController = Reflect.getMetadata('$exceptionFilters', _prototype) || []
        let filtersOnAction = Reflect.getMetadata('$exceptionFilters', _prototype, actionName) || []
        let filters = this.container.getComponentsByTag('$isGlobalExceptionFilter').concat(filtersOnController, filtersOnAction).reverse()

        let [exceptionFilter, handlerName] = this.getExceptionHandlerName(errConstructor, ctxPath, filters)
        if (!handlerName) {
            [exceptionFilter, handlerName] = this.getExceptionHandlerName(Error, ctxPath, filters)
        }

        return [exceptionFilter, handlerName]
    }

    private async handleContext(actionName: string, _Class: new (...args: any[]) => {}, ctx: Koa.Context) {
        let _prototype = _Class.prototype
        let instance = await this.container.getComponentInstanceFromFactory(_prototype.constructor)
        let $params = Reflect.getMetadata('$params', _prototype, actionName) || []//使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
        let $paramTypes: Function[] = Reflect.getMetadata('design:paramtypes', _prototype, actionName) || []//全部的参数类型
        let $paramValidators: Function[][] = Reflect.getMetadata('$paramValidators', _prototype, actionName) || []//全部的参数验证器
        let params = $params.map((b: Function, idx: number) => {
            let originalValArr = b(ctx)
            let originalVal = originalValArr[0]
            let typeSpecified = originalValArr[1]
            let toType = $paramTypes[idx]
            if (typeSpecified && toType) {
                return Utils.getTypeSpecifiedValue(toType, originalVal)
            } else {
                return originalVal
            }
        })
        /**
         * 验证Action内参数
         */
        for (let i = 0; i < params.length; i++) {
            let validators = $paramValidators[i]
            if (validators == null) {
                continue
            }
            for (let validator of validators) {
                validator(params[i])
            }
        }
        /**
         * 验证Action外参数
         */
        for (let b of params) {
            Utils.validateModel(b)
        }
        let actionFilterContext = new ActionFilterContext(ctx, params, $paramTypes, _Class, actionName)

        let filterAndInstances = await this.getFilterAndInstances(_prototype, actionName, ctx.path)
        for (let [filter, filterInstance] of filterAndInstances) {
            let handlerName = Reflect.getMetadata('$actionHandlerMap', filter.prototype).get(DoBefore)
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
            let handlerName = Reflect.getMetadata('$actionHandlerMap', filter.prototype).get(DoAfter)
            if (!handlerName) {
                continue
            }
            await filterInstance[handlerName](actionFilterContext)
        }
    }

    @InnerCachable({ keys: [[0, ''], [1, ''], [2, '']] })
    private async getFilterAndInstances(_prototype: any, actionName: string, ctxPath: string) {
        let filtersOnController = Reflect.getMetadata('$actionFilters', _prototype) || []
        let filtersOnAction = Reflect.getMetadata('$actionFilters', _prototype, actionName) || []
        let globalActionFilters = this.getGlobalActionFiltersOfThisPath(ctxPath)
        let filters = globalActionFilters.concat(filtersOnController, filtersOnAction)
        let filterAndInstances: [new (...args: any[]) => {}, any][] = []
        for (let filter of filters) {
            let filterInstance = await this.container.getComponentInstanceFromFactory(filter)
            filterAndInstances.push([filter, filterInstance])
        }

        return filterAndInstances
    }

    @InnerCachable({ keys: [[0, '']] })
    getGlobalActionFiltersOfThisPath(path: string) {
        let globalActionFilters = this.container.getComponentsByTag('$isGlobalActionFilter')
        return globalActionFilters.filter(a => this.isThisPathInScope(path, Reflect.getMetadata('$scope', a.prototype)))
    }

    private getExceptionHandlerName(exceptionType: new (...args: any[]) => {}, path: string, filters: (new (...args: any[]) => {})[]): [(new (...args: any[]) => {})?, string?] {
        for (let a of filters) {
            if (Reflect.getMetadata('$isGlobalExceptionFilter', a.prototype)) {
                let $scope: string = Reflect.getMetadata('$scope', a.prototype)
                if (!this.isThisPathInScope(path, $scope)) {
                    continue
                }
            }
            let handlerName = Reflect.getMetadata('$exceptionHandlerMap', a.prototype).get(exceptionType)
            if (handlerName) {
                return [a, handlerName]
            }
        }
        return []
    }

    @InnerCachable({ keys: [[0, ''], [1, '']] })
    private isThisPathInScope(path: string, $scope: string) {
        let $scopeArr = $scope.split('/').filter(b => b)
        let pathArr = path.split('/').filter(b => b)
        if ($scopeArr.some((b, i) => pathArr[i] != b)) {
            return false
        }

        return true
    }

    private async handlerException(exceptionFilter: new (...args: any[]) => {}, handlerName: string, err: any, ctx: Koa.Context) {
        let exceptionFilterInstance = await this.container.getComponentInstanceFromFactory(exceptionFilter)
        await exceptionFilterInstance[handlerName](ctx, err)
    }

    private async initControllers() {
        let controllerList = this.container.getComponentsByTag('$isController')
        for (let controllerClass of controllerList) {
            await this.container.getComponentInstanceFromFactory(controllerClass)
        }
    }

    private async initFilters() {
        let globalActionFilters = this.container.getComponentsByTag('$isGlobalActionFilter').sort((a, b) => Reflect.getMetadata('$order', b.prototype) - Reflect.getMetadata('$order', a.prototype))
        let globalExceptionFilters = this.container.getComponentsByTag('$isGlobalExceptionFilter')
        for (let filter of globalActionFilters) {
            await this.container.getComponentInstanceFromFactory(filter)
        }
        for (let filter of globalExceptionFilters) {
            await this.container.getComponentInstanceFromFactory(filter)
        }
    }

    private useNotFoundExceptionHandler() {
        this.app.use(async ctx => {
            let globalExceptionFilters = this.container.getComponentsByTag('$isGlobalExceptionFilter')
            let [exceptionFilter, handlerName] = this.getExceptionHandlerName(NotFoundException, '/', globalExceptionFilters)
            if (!handlerName) {
                return
            }
            await this.handlerException(exceptionFilter, handlerName, new NotFoundException(), ctx)
        })
    }
}