/// <reference types="node" />
import Koa = require('koa');
import { Server } from 'http';
export declare class DogBootApplication {
    app: Koa<any, {}>;
    server: Server;
    controllerClasses: (new (...args: any[]) => {})[];
    private readyToAcceptRequest;
    private globalExceptionFilter;
    private globalActionFilters;
    private requestHandler;
    private opts;
    private container;
    constructor();
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
     * 主动热更新程序
     */
    reload(): Promise<this>;
    /**
     * 异步启动程序，程序完全启动后才会返回
     */
    runAsync(): Promise<this>;
    private test;
}
