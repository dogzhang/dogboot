/**
 * 表示一个延迟渲染对象，dogboot不会直接把此对象赋值给ctx.body，而是保存为ctx.state.LazyResult，具体怎样渲染，还需要应用层使用ActionFilter来处理
 */
export class LazyResult {
    constructor(readonly data: any) { }
}