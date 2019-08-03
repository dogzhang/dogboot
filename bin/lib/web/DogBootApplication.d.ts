/// <reference types="node" />
import Koa = require('koa');
import { Server } from 'http';
import { DIContainer } from '../core/DIContainer';
import { DogBootOptions } from './DogBootOptions';
export declare class DogBootApplication {
    private readonly opts;
    private readonly container;
    app: Koa<any, {}>;
    server: Server;
    controllerClasses: (new (...args: any[]) => {})[];
    private readyToAcceptRequest;
    private globalExceptionFilter;
    private globalActionFilters;
    private requestHandler;
    constructor(opts: DogBootOptions, container: DIContainer);
    private init;
    private build;
    private checkControllerClass;
    private checkAndHandleActionName;
    private handleContext;
    private getExceptionHandlerName;
    private handlerException;
    private startUp;
    private initComponents;
    private initFilters;
    private buildApidoc;
    private useNotFoundExceptionHandler;
    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    private runAsync;
}
