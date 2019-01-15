import path = require('path');
import pug = require('pug');

import { DogBootApplication, DogBootApplicationConfig } from "./lib/DogBoot";
import { MyExceptionFilter } from './filter/MyExceptionFilter';
import { ActionFilter0 } from './filter/ActionFilter0';
import { ActionFilter1 } from './filter/ActionFilter1';

let appRoot = require('app-root-path').path
var viewPath = path.join(appRoot, 'view')

let dogBootApplicationConfig: DogBootApplicationConfig = {
    appRoot,
    controllerPath: path.join(__dirname, 'controller'),
    publicPath: path.join(appRoot, 'public'),
    startUpPath: path.join(__dirname, 'startup')
}

new DogBootApplication(dogBootApplicationConfig)
    .useExceptionFilter(MyExceptionFilter)
    .useActionFilter(ActionFilter0)
    .useActionFilter(ActionFilter1)
    .setPort(3000)
    .setRender((controllerName: string, actionName: string, data: any) => {
        var viewFullPath = path.join(viewPath, controllerName, actionName) + '.pug'
        var func = pug.compileFile(viewFullPath, { cache: false })
        return func(data)
    })
    .run()