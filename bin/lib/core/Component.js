"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
/**
 * 指定此类为组件，生命周期将完全交给dogboot管理
 * 所有组件将在程序启动的时候初始化完成，所有组件初始化完成后，程序才会开始接受http请求
 * @param target
 */
function Component(target) {
    Utils_1.Utils.markAsComponent(target);
}
exports.Component = Component;
/**
 * 指定此类为预启动组件，将在程序启动时预先启动。
 * 事实上，所有的组件只要被使用到都会在程序启动时预先启动，使用StartUp标记那些没有被其他组件使用的组件，确保此组件也能启动
 * StartUp是一种特殊的Component
 * @param order 优先级，值越大越优先启动，默认值：0
 */
function StartUp(order = 0) {
    return function (target) {
        Reflect.defineMetadata('$isStartUp', true, target.prototype);
        Reflect.defineMetadata('$order', order, target.prototype);
        Utils_1.Utils.markAsComponent(target);
    };
}
exports.StartUp = StartUp;
/**
 * 标记此类为全局请求过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 请求过滤器作用方式遵循洋葱模型，执行顺序为：
 *     1、低优先级ActionFilter.DoBefore
 *     2、高优先级ActionFilter.DoBefore
 *     3、Controller.Action
 *     4、高优先级ActionFilter.DoAfter
 *     5、低优先级ActionFilter.DoAfter
 * 任何DoBefore导致ctx.status != 404都将阻止后续步骤的执行，但是Controller.Action执行成功后后续的DoAfter都会执行
 * ActionFilter是一种特殊的Component
 * @param opts order：优先级，值越大优先级越高，scope：作用域，匹配ctx.path，默认'/'表示作用于全部action
 */
function GlobalActionFilter(opts) {
    return function (target) {
        var _a, _b;
        opts = opts || {};
        opts.order = (_a = opts.order) !== null && _a !== void 0 ? _a : 0;
        opts.scope = (_b = opts.scope) !== null && _b !== void 0 ? _b : '/';
        Reflect.defineMetadata('$isGlobalActionFilter', true, target.prototype);
        Reflect.defineMetadata('$order', opts.order, target.prototype);
        Reflect.defineMetadata('$scope', opts.scope, target.prototype);
        Utils_1.Utils.markAsComponent(target);
    };
}
exports.GlobalActionFilter = GlobalActionFilter;
/**
 * 标记此类为局部请求过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，靠前的优先级更高
 * 配合UseActionFilter来使用
 */
function ActionFilter(target) {
    Reflect.defineMetadata('$isActionFilter', true, target.prototype);
    Utils_1.Utils.markAsComponent(target);
}
exports.ActionFilter = ActionFilter;
/**
 * 标记此类为全局异常过滤器，此类将会被dogboot自动扫描到并且应用到所有的控制器以及其Action
 * 注意，ExceptionFilter的顺序没有明确规定，只能被一个处理器匹配到
 * ExceptionFilter是一种特殊的Component
 * @param scope 作用域限制，匹配ctx.path，默认'/'表示作用与全部action
 */
function GlobalExceptionFilter(opts) {
    return function (target) {
        var _a;
        opts = opts || {};
        opts.scope = (_a = opts.scope) !== null && _a !== void 0 ? _a : '/';
        Reflect.defineMetadata('$isGlobalExceptionFilter', true, target.prototype);
        Reflect.defineMetadata('$scope', opts.scope, target.prototype);
        Utils_1.Utils.markAsComponent(target);
    };
}
exports.GlobalExceptionFilter = GlobalExceptionFilter;
/**
 * 标记此类为局部异常过滤器，除非被显式使用，否则不会生效，可以作用于Controller以及Action
 * 该过滤器优先级高于全局，一个Controller或者Action同时使用多个局部过滤器时，只会使用第一个
 * 配合UseExceptionFilter来使用
 */
function ExceptionFilter(target) {
    Reflect.defineMetadata('$isExceptionFilter', true, target.prototype);
    Utils_1.Utils.markAsComponent(target);
}
exports.ExceptionFilter = ExceptionFilter;
/**
 * 表示一个配置文件映射器
 * Config是一种特殊的Component
 * @param field 需要映射的节
 */
function Config(opts) {
    return function (target) {
        opts = opts || {};
        Reflect.defineMetadata('$isConfig', true, target.prototype);
        Reflect.defineMetadata('$configField', opts.field || '', target.prototype);
        Reflect.defineMetadata('$configName', opts.name || 'config.json', target.prototype);
        Utils_1.Utils.markAsComponent(target);
    };
}
exports.Config = Config;
/**
 * 通过属性注入依赖的组件
 * @param type
 */
function Autowired(type) {
    return function (target, name) {
        if (!type) {
            console.error(`${target.constructor.name}中存在不正确的循环依赖${name}，请使用@Autowired(() => type of ${name})注入此依赖项`);
            process.abort();
        }
        let $autowiredMap = Reflect.getMetadata('$autowiredMap', target) || new Map();
        $autowiredMap.set(name, type);
        Reflect.defineMetadata('$autowiredMap', $autowiredMap, target);
    };
}
exports.Autowired = Autowired;
/**
 * 在组件中标记一个方法，使其在组件初始化时执行，支持异步方法，并且会传入热更新前的实例作为参数
 */
function Init(target, name) {
    Reflect.defineMetadata('$initMethod', name, target);
}
exports.Init = Init;
/**
 * 指定Controller或者一个Action使用指定的Action过滤器
 * 只能用于Controller中
 * @param actionFilter 要使用的过滤器
 */
function UseActionFilter(actionFilter) {
    return function (target, name = null) {
        if (!Reflect.getMetadata('$isActionFilter', actionFilter.prototype)) {
            console.warn(`UseActionFilter只能使用ActionFilter，此actionFilter不符合要求，${actionFilter.name}将不会生效`);
            return;
        }
        if (name == null) {
            let $actionFilters = Reflect.getMetadata('$actionFilters', target.prototype) || [];
            $actionFilters.unshift(actionFilter);
            Reflect.defineMetadata('$actionFilters', $actionFilters, target.prototype);
        }
        else {
            let $actionFilters = Reflect.getMetadata('$actionFilters', target, name) || [];
            $actionFilters.unshift(actionFilter);
            Reflect.defineMetadata('$actionFilters', $actionFilters, target, name);
        }
    };
}
exports.UseActionFilter = UseActionFilter;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行前执行
 */
function DoBefore(target, name) {
    let $actionHandlerMap = Reflect.getMetadata('$actionHandlerMap', target) || new Map();
    $actionHandlerMap.set(DoBefore, name);
    Reflect.defineMetadata('$actionHandlerMap', $actionHandlerMap, target);
}
exports.DoBefore = DoBefore;
/**
 * 在ActionFilter标记一个方法，此方法将在Action执行后执行
 */
function DoAfter(target, name) {
    let $actionHandlerMap = Reflect.getMetadata('$actionHandlerMap', target) || new Map();
    $actionHandlerMap.set(DoAfter, name);
    Reflect.defineMetadata('$actionHandlerMap', $actionHandlerMap, target);
}
exports.DoAfter = DoAfter;
/**
 * 指定Controller或者一个Action使用指定的异常过滤器
 * 只能用于Controller中
 * @param exceptionFilter 要使用的过滤器
 */
function UseExceptionFilter(exceptionFilter) {
    return function (target, name = null) {
        if (!Reflect.getMetadata('$isExceptionFilter', exceptionFilter.prototype)) {
            console.warn(`UseExceptionFilter只能使用ExceptionFilter，此exceptionFilter不符合要求，${exceptionFilter.name}将不会生效`);
            return;
        }
        if (name == null) {
            let $exceptionFilters = Reflect.getMetadata('$exceptionFilters', target.prototype) || [];
            $exceptionFilters.unshift(exceptionFilter);
            Reflect.defineMetadata('$exceptionFilters', $exceptionFilters, target.prototype);
        }
        else {
            let $exceptionFilters = Reflect.getMetadata('$exceptionFilters', target, name) || [];
            $exceptionFilters.unshift(exceptionFilter);
            Reflect.defineMetadata('$exceptionFilters', $exceptionFilters, target, name);
        }
    };
}
exports.UseExceptionFilter = UseExceptionFilter;
/**
 * 在ExceptionFilter中，标记一个方法，用于处理指定类型的异常
 * @param type 要处理的异常类型
 */
function ExceptionHandler(type) {
    return function (target, name) {
        let $exceptionHandlerMap = Reflect.getMetadata('$exceptionHandlerMap', target) || new Map();
        $exceptionHandlerMap.set(type, name);
        Reflect.defineMetadata('$exceptionHandlerMap', $exceptionHandlerMap, target);
    };
}
exports.ExceptionHandler = ExceptionHandler;
/**
 * 标记一个类为测试类，程序启动完成后，将会自动执行这些测试
 * 所有的测试类都必须放在test目录，或者另外指定的目录
 */
function Test(target) {
    Reflect.defineMetadata('$isTest', true, target.prototype);
    Utils_1.Utils.markAsComponent(target);
}
exports.Test = Test;
/**
 * 标记一个方法为测试方法，程序启动完成后，将会自动执行这些测试
 * 仅能在Test类中使用
 */
function Spec(target, name) {
    let $testMethods = Reflect.getMetadata('$testMethods', target) || [];
    $testMethods.push(name);
    Reflect.defineMetadata('$testMethods', $testMethods, target);
}
exports.Spec = Spec;
/**
 * 标记一个类或者方法，表示此类/方法唯一，dogboot的测试功能会检测only，当有任何类/方法被标记为only，测试将会跳过同一级别其他对象
 */
function Only(target, name = null) {
    if (name == null) {
        Reflect.defineMetadata('$only', true, target.prototype);
    }
    else {
        Reflect.defineMetadata('$only', true, target, name);
        Reflect.defineMetadata('$only', true, target);
    }
}
exports.Only = Only;
//# sourceMappingURL=Component.js.map