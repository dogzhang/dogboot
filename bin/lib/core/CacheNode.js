"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CacheNode {
    constructor(parent, key) {
        this.parent = parent;
        this.key = key;
        this.children = new Map();
        if (this.parent == null) {
            setInterval(() => {
                this.check();
            }, 60000);
        }
    }
    get value() {
        if (this.expireTime == null || this.expireTime > Date.now()) {
            return this._value;
        }
        return null;
    }
    set value(val) {
        this._value = val;
    }
    check() {
        this.checkValue();
        this.checkChildren();
        if (this.value == null && this.children.size == 0) {
            this.removeMyself();
        }
    }
    checkValue() {
        if (this.parent == null) {
            return;
        }
        if (this.expireTime == null) {
            return;
        }
        if (this.expireTime > Date.now()) {
            return;
        }
        this.value = null;
    }
    checkChildren() {
        this.children.forEach(a => a.check());
    }
    get(...keys) {
        let node = this;
        for (let key of keys) {
            node = node.children.get(key);
            if (node == null) {
                return null;
            }
        }
        return node.value;
    }
    set(val, maxAge, ...keys) {
        let [key, ..._keys] = [...keys];
        let node = this.children.get(key);
        if (node == null) {
            node = new CacheNode(this, key);
        }
        if (_keys.length == 0) {
            node.value = val;
            if (maxAge != null) {
                node.expireTime = Date.now() + maxAge;
            }
        }
        else {
            node.set(val, maxAge, ..._keys);
        }
        this.children.set(key, node);
    }
    delete(...keys) {
        if (keys.length == 0) {
            this.clear();
            return;
        }
        let [key, ..._keys] = [...keys];
        let node = this.children.get(key);
        if (node != null) {
            if (_keys.length == 0) {
                node.clear();
            }
            else {
                node.delete(..._keys);
            }
        }
        if (this.parent != null && this.value == null && this.children.size == 0) {
            this.parent.children.delete(this.key);
        }
    }
    removeMyself() {
        if (this.parent != null) {
            this.parent.children.delete(this.key);
        }
    }
    clear() {
        this.value = null;
        this.children.clear();
        this.removeMyself();
    }
}
exports.CacheNode = CacheNode;
//# sourceMappingURL=CacheNode.js.map