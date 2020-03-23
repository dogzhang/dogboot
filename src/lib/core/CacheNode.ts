export class CacheNode {
    private _value: any
    private expireTime: number
    private children: Map<any, CacheNode> = new Map()
    constructor(private readonly parent?: CacheNode, private readonly key?: any) {
        if (this.parent == null) {
            setInterval(() => {
                this.check()
            }, 60000)
        }
    }

    private get value() {
        if (this.expireTime == null || this.expireTime > Date.now()) {
            return this._value
        }
        return null
    }
    private set value(val) {
        this._value = val
    }

    private check() {
        this.checkValue()
        this.checkChildren()
        if (this.value == null && this.children.size == 0) {
            this.removeMyself()
        }
    }

    private checkValue() {
        if (this.parent == null) {
            return
        }
        if (this.expireTime == null) {
            return
        }
        if (this.expireTime > Date.now()) {
            return
        }
        this.value = null
    }

    private checkChildren() {
        this.children.forEach(a => a.check())
    }

    get(...keys: any[]) {
        let node: CacheNode = this
        for (let key of keys) {
            node = node.children.get(key)
            if (node == null) {
                return null
            }
        }
        return node.value
    }

    set(val: any, maxAge: number, ...keys: any[]) {
        let [key, ..._keys] = [...keys]

        let node = this.children.get(key)
        if (node == null) {
            node = new CacheNode(this, key)
        }
        if (_keys.length == 0) {
            node.value = val
            if (maxAge != null) {
                node.expireTime = Date.now() + maxAge
            }
        } else {
            node.set(val, maxAge, ..._keys)
        }
        this.children.set(key, node)
    }

    delete(...keys: any[]) {
        if (keys.length == 0) {
            this.clear()
            return
        }
        let [key, ..._keys] = [...keys]
        let node = this.children.get(key)
        if (node != null) {
            if (_keys.length == 0) {
                node.clear()
            } else {
                node.delete(..._keys)
            }
        }
        if (this.parent != null && this.value == null && this.children.size == 0) {
            this.parent.children.delete(this.key)
        }
    }

    private removeMyself() {
        if (this.parent != null) {
            this.parent.children.delete(this.key)
        }
    }

    private clear() {
        this.value = null
        this.children.clear()
        this.removeMyself()
    }
}