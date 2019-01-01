import path = require('path');
import pug = require('pug');

import { DogBootApplication } from "./lib/DogBoot";
import { MyExceptionFilter } from './filter/MyExceptionFilter';
import { ActionFilter0 } from './filter/ActionFilter0';
import { ActionFilter1 } from './filter/ActionFilter1';

var viewPath = path.join(process.cwd(), 'view')

new DogBootApplication(path.join(__dirname, 'controller'))
    .addService('asd', 123)
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