/// <reference types="node" />
import Koa = require('koa');
import { Server } from 'http';
import { Area } from './Area';
export declare class DogBootApplication {
    app: Koa<any, {}>;
    server: Server;
    area: Area;
    private globalExceptionFilters;
    private globalActionFilters;
    private requestHandler;
    private opts;
    private container;
    constructor();
    private build;
    private checkControllerDir;
    private checkControllerClass;
    private checkAndHandleActionName;
    private handleContext;
    private getExceptionHandlerName;
    private handlerException;
    private startUp;
    private initControllers;
    private initFilters;
    private buildApidoc;
    private useNotFoundExceptionHandler;
    /**
     * 主动热更新程序
     */
    reload(): Promise<this>;
    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    runAsync(): Promise<this>;
    private test;
}
