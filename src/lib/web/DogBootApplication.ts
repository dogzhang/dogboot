import path = require('path');
import Koa = require('koa');
import Router = require('koa-router');
import koaBody = require('koa-body');
import koaStatic = require('koa-static');
import cors = require('koa2-cors')
import { Server } from 'http';

import { DIContainer, DoAfter, DoBefore, Init, InnerCachable, StartUp, Utils } from '../core';
import { ActionFilterContext } from './ActionFilterContext';
import { APIDocController } from './APIDocController';
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
        this.buildApidoc()
        this.useNotFoundExceptionHandler()

        let port = this.opts.port
        if (process.env.dogPort) {
            port = Number.parseInt(process.env.dogPort)
        }

        this.server = this.app.listen(port)

        await this.initControllers()
        await this.initFilters()

        let endTime = Date.now()
        console.log(`Your application has started at ${port} in ${endTime - this.container.startTime}ms`)

        return this
    }

    private build() {
        let publicRootPath = path.join(Utils.getAppRootPath(), 'public')
        this.app.use(koaStatic(publicRootPath))
        this.app.use(koaBody())

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
                let filtersOnController = Reflect.getMetadata('$exceptionFilters', _prototype) || []
                let filtersOnAction = Reflect.getMetadata('$exceptionFilters', _prototype, actionName) || []
                let filters = this.container.getComponentsByTag('$isGlobalExceptionFilter').concat(filtersOnController, filtersOnAction).reverse()

                let [exceptionFilter, handlerName] = this.getExceptionHandlerName(err.constructor, ctx.path, filters)
                if (!handlerName) {
                    [exceptionFilter, handlerName] = this.getExceptionHandlerName(Error, ctx.path, filters)
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
        let $params = Reflect.getMetadata('$params', _prototype, actionName) || []//使用@Bind...注册的参数，没有使用@Bind...装饰的参数将保持为null
        let $paramTypes: Function[] = Reflect.getMetadata('design:paramtypes', _prototype, actionName) || []//全部的参数类型
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
        for (let b of params) {
            Utils.validateModel(b)
        }
        let actionFilterContext = new ActionFilterContext(ctx, params, $paramTypes, _Class, actionName)

        let filtersOnController = Reflect.getMetadata('$actionFilters', _prototype) || []
        let filtersOnAction = Reflect.getMetadata('$actionFilters', _prototype, actionName) || []
        let globalActionFilters = this.getGlobalActionFiltersOfThisPath(ctx.path)
        let filters = globalActionFilters.concat(filtersOnController, filtersOnAction)
        let filterAndInstances: [new (...args: any[]) => {}, any][] = []
        for (let filter of filters) {
            let filterInstance = await this.container.getComponentInstanceFromFactory(filter)
            filterAndInstances.push([filter, filterInstance])

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

    private buildApidoc() {
        if (!this.opts.enableApidoc) {
            return
        }
        this.checkControllerClass(APIDocController)
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