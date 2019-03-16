## 介绍
dogboot是一款nodejs的web框架，使用Typescript编写，支持最新的js/ts语法。在设计理念上，我们致敬了著名的Java框架Spring Boot，装饰器、依赖注入等等，都是web开发中最流行的技术。
## 技术要点
- TypeScript
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

这是一个Typescript程序，为了运行它，你还需要安装Typescript，使用以下命令安装
```bash
npm i typescript -D
```

如果一切顺利，你应该已经安装好所有必须包了，接下来，根据约定优于配置的理念，创建一些常用的目录以及文件

最终，你的目录结构大概如下

```
├──src
|  ├── controller
|  |   └── HomeController.ts
|  ├── startup
|  |   └── StartUp1.ts
|  └── App.ts
├──package-lock.json
├──package.json
├──README.md
└──tsconfig.json
```
tsconfig.json是Typescript项目的可选配置文件，对于dogboot我们建议填入以下内容（更高级的配置，请参考[http://www.typescriptlang.org/docs/handbook/tsconfig-json.html]），
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

async function go() {
    let appRoot = path.resolve(__dirname, '..')
    let app = new DogBootApplication(appRoot)
        .run()
}

go()
```
打开HomeController.ts，输入以下内容
```
import { Controller, GetMapping, BindQuery } from "../lib/DogBoot";

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
万事俱备，请在浏览器输入[http://localhost:3000?name=World]

你将看到
```
Hello World
```
这是一个完整的dogboot程序，简单吧