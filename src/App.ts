import path = require('path');
import pug = require('pug');

import { DogBootApplication } from "./lib/DogBoot";
import { Context } from "koa";
import { JsonResultUtil } from "./common/JsonResultUtil";
import { AuthorizationFilter } from './filter/AuthorizationFilter';
import { MyExceptionFilter } from './filter/MyExceptionFilter';

var viewPath = path.join(process.cwd(), 'view')

new DogBootApplication(path.join(__dirname, 'controller'))
    .setPort(3000)
    .setRender((controllerName: string, actionName: string, data: any) => {
        var viewFullPath = path.join(viewPath, controllerName, actionName) + '.pug'
        var func = pug.compileFile(viewFullPath, { cache: false })
        return func(data)
    })
    .run()