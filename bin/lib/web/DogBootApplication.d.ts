/// <reference types="node" />
import Koa = require('koa');
import { Server } from 'http';
import { DIContainer } from '../core';
import { DogBootOptions } from './DogBootOptions';
export declare class DogBootApplication {
    private readonly opts;
    private readonly container;
    app: Koa<Koa.DefaultState, Koa.DefaultContext>;
    server: Server;
    constructor(opts: DogBootOptions, container: DIContainer);
    init(): Promise<this>;
    private build;
    private checkControllerClass;
    private checkAndHandleActionName;
    private getExceptionFilterAndHandlerName;
    private handleContext;
    private getFilterAndInstances;
    getGlobalActionFiltersOfThisPath(path: string): (new (...args: any[]) => {})[];
    private getExceptionHandlerName;
    private isThisPathInScope;
    private handlerException;
    private initControllers;
    private initFilters;
    private useNotFoundExceptionHandler;
}
