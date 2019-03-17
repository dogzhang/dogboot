## 介绍
dogboot是一款用于nodejs的web框架，使用Typescript编写，支持最新的js/ts语法。在设计理念上，我们致敬了著名的Java框架Spring Boot，装饰器、依赖注入等等，都是web开发中最流行的技术。
## 技术要点
- 支持且仅支持TypeScript
- 基于koa2
- async/await
- 装饰器
- 依赖注入
- 约定优于配置
## 从0开始
```bash
mkdir dogboot-demo
cd dogboot-demo
npm init -y
npm i dogboot
```
这样，你就安装了dogboot

这是一个Typescript程序，为了运行它，你还需要安装Typescript，还是在刚才的目录，使用以下命令安装
```bash
npm i typescript -D
```

如果一切顺利，你应该已经安装好所有必须包了，接下来，根据约定优于配置的理念，创建一些目录以及文件

最终，你的目录结构大概如下

```
├──src
|  ├── controller
|  |   └── HomeController.ts
|  └── App.ts
├──package-lock.json
├──package.json
├──README.md
└──tsconfig.json
```
tsconfig.json是Typescript项目的可选配置文件，对于dogboot我们建议填入以下内容（更高级的配置，请参考[http://www.typescriptlang.org/docs/handbook/tsconfig-json.html](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html)），
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "esnext",
    "lib": ["es2017"],
    "outDir": "dist",
    "watch": true
  },
  "include": ["src"]
}
```
打开App.ts，输入以下内容
```typescript
import path = require('path');
import { DogBootApplication } from "dogboot";

let appRoot = path.resolve(__dirname, '..')
new DogBootApplication(appRoot).run()
```
打开HomeController.ts，输入以下内容
```
import { Controller, GetMapping, BindQuery } from "dogboot";

@Controller('/home')
export class HomeController {
    @GetMapping('/index')
    async index(@BindQuery('name') name: string) {
        return `Hello ${name}`
    }
}
```
现在，最小可运行环境已经准备好，是时候检查一下成果了，执行以下命令启动程序
```bash
npm run tsc
npm start
```
你会在控制台看到你的一行日志打印
```
Your application has started at 3000 in xxxms
```
万事俱备，请在浏览器输入[http://localhost:3000?name=World](http://localhost:3000?name=World)

你将看到
```
Hello World
```
这就是一个最小可运行的dogboot程序，怎么样，简单吧🙃

当然你肯定不会满足于这个Hello World例子，那就请继续阅读我们的进阶文档吧

## DogBootApplication
一个dogboot程序始于DogBootApplication类，只需要提供一个appRootPath参数就可以了。执行run方法的时候，程序会依据dogboot约定的目录习惯扫描appRootPath目录下的文件夹。

这其中包含以下几种：

controller：此目录包含所有的控制器文件，关于controller的更多介绍，请参考

startup：此目录包含所有的预启动文件，关于startup的更多介绍，请参考

程序会自动判断当前的运行环境，如果是直接运行ts文件，会扫描src目录，如果是运行编译后的js文件，会扫描dist目录。

⚠️所以实际上，我们指定了编译后的文件存放的目录为dist，不能修改。
## @Controller
使用@Controller装饰器标记一个类为控制器，并且传入一个可选的path参数，用于指定路由前缀。按照约定，控制器文件名应该以Controller结尾，但这不是必须的。path参数是可选的，如果不传，dogboot会指定这个类名的前面一部分并且转为小写作为路由前缀。比如：HomeController的默认路由前缀是/home。
## @StartUp
使用@StartUp装饰器标记一个类为预启动类，并且传入一个可选的order参数。dogboot程序在正式接受用户的请求之前会先执行预启动类的启动方法，使用order参数定制你希望的启动顺序。
## @Config
使用@Config标记一个类为配置文件映射器，并且传入一个可选的field参数。使用配置文件映射器，而不是require('config.json')，前者得到的对象具有类型声明，更便于使用。
field参数表示映射器映射的配置节，如果不传，表示整个配置文件，使用a.b.c映射a节下的b节下的c。

⚠️所以，⚠不要在你的配置文件中使用任何类似于a.b表示一个节，这会使配置映射器出错。

配置映射器会自动转化你的字段类型，避免使用的时候出现误差。比如，你在配置文件里面有一个配置，a:'1'，但是你把这个a当成number类型来使用，这可能会导致严重的程序bug，比如let b = a + 1，你期望b === 2，可是实际上，b === '11'。dogboot在映射配置文件的时候会自动转换类型为你期望的类型，从根本规避了犯这种错误的可能性。
## @Component
使用@Component标记一个类为可注入组件，同时也表示此组件的生命周期完全交给dogboot内置的依赖注入管理器管理。

Controller、StartUp、Config本质上也是Component。
## @Init
组件可以使用@Init标记一个方法，方法名称不限定，这个方法用于依赖注入管理器初始化组件时调用，支持异步方法。虽然类构造器里面可以做一些初始化的工作，但是类构造器不能使用await执行异步方法，所以特别添加了这个装饰器。

## Autowired
用于属性注入，用法如下
```typescript
@Controller()
export class HomeController{
  @Autowired(UserService)
  userService: UserService

  GetMapping()
  index(){
    return this.userService.doSomething()
  }
}
```
dogboot同时也支持构造器注入，用法如下
```typescript
@Controller()
export class HomeController{
  constructor(private readonly userService: UserService){}

  GetMapping()
  index(){
    return this.userService.doSomething()
  }
}
```
大部分情况下，两者功能一致，唯一的不同是：Autowired可以实现循环依赖，虽然应该尽量避免出现循环依赖，但是我们也为那些特殊情况做了考虑。加入UserService依赖ItemService，同时ItemService又依赖UserService，你可以使用一种“稍微难懂”的写法来实现循环依赖。用法如下

UserService.ts
```
@Component
export class UserService {

    constructor() {
        console.log('UserService', Math.random())
    }

    @Autowired(() => ItemService)
    itemService: ItemService
    index() {
        console.log('UserService')
    }
}
```
ItemService.ts
```
@Component
export class ItemService {

    constructor() {
        console.log('ItemService', Math.random())
    }

    @Autowired(() => UserService)
    userService: UserService;
    index() {
        console.log('ItemService')
    }
}
```
仔细看，使用了@Autowired(() => UserService)而不是@Autowired(UserService)

## @Mapping
用于将Controller内的方法映射为路由，需要传入method以及path参数。这两个参数不是必须的，默认会映射get方法，并且使用方法名作为路由，为了方便书写，我们提前准备好了几种常用的method对应的Mapping。分别是@GetMapping、@PostMapping、@PutMapping、@PatchMapping、@DeleteMapping、@HeadMapping。如果你要映射所有的method，可以使用AllMapping，你将可以使用任何method来请求此路由。
## BindContext
用于获取请求上下文信息，这个上下文信息完全是koa提供的请求上下文，所以你可以从koa官网找到关于请求上下文的详细介绍，使用方式如下
```
@Controller()
export class HomeController{
  GetMapping()
  index(@BindContext ctx:Koa.Context){
    console.log(ctx.query.name)
    return 'ok'
  }
}
```
类似的获取koa原生请求对象的装饰器还有：@BindRequest、@BindResponse。
## @BindQuery
使用@BindQuery获取url中查询参数，dogboot将会自动转换参数类型为期望的类型。在我们的从0开始中已经介绍过这个用法，就不重复介绍了。类似的装饰器还有：

@BindPath 用于获取path参数

@BindBody 用于获取请求体对象
## @Typed
表示此字段需要转换为指定类型
## @TypedArray
如果需要转换的字段是一个数组，@Typed就无法胜任了，因为ts的Array是一个泛型，且程序运行时无法知道泛型确切类型，所以转换数组时还需要指定确切类型
## @NotNull
对于请求参数，你可能需要做一些通用的验证，避免冗余代码，此装饰器用于指定此字段不可为空。

类似的装饰器还有：@NotEmpty、@NotBlank、@Length、@MinLength、@MaxLength、@Range、@Min、@Max、@Decimal、@MinDecimal、@MaxDecimal、@Reg、你也可以使用更加灵活的@Func，支持传入自定义的验证方法。除了这些已经预先定义的验证装饰器，你还可以封装自己的验证装饰器，参考dogboot中@NotNull的源码
```
/**
 * a != null
 * @param errorMesage 
 */
export function NotNull(errorMesage: string = null) {
    errorMesage = errorMesage || '字段不能为空'
    return Func(a => {
        if (a != null) {
            return [true]
        }
        return [false, errorMesage]
    })
}
```