/**
 * 1.通过Object.defineProperty劫持data中的变量，达到两点效果
 *   1.1 读：做依赖收集
 *   1.2 存：发布给“读”中收集到的订阅者
 * 2.通过第一次渲染$mount，完成依赖收集
 * 
 * 3.当data中的属性值发生变化时，监听到变化，并且发送给订阅者，更新视图（例子中用console替代视图变化）
 */
class Watcher {
    constructor(vm, getter) {
        this.vm = vm
        this.getter = getter
        this.get()
    }

    get() {
        pushTarget(this)
        this.getter.call(this.vm)
        popTarget()
    }
    update() {
        this.get()
    }
}

const targetStack = []
function pushTarget(_target) {
    if (Dep.target) targetStack.push(_target)
    Dep.target = _target
}
function popTarget() {
    Dep.target = targetStack.pop()
}

class Vue {
    constructor(options) {
        this._data = options.data
        this._render = options.render
        proxy(options.data, this)
        observe(this._data)
        this.$mount()
    }

    $mount() {
        new Watcher(this, this._render)
    }
}

class Dep {
    constructor() {
        this.deps = new Set()
    }
    depend() {
        if (Dep.target) {
            this.deps.add(Dep.target)
        }
    }
    notify() {
        this.deps.forEach(watcher => watcher.update())
    }
}

function observe(data) {
    const dep = new Dep()
    Object.keys(data).forEach(key => defineReactive(data, key, data[key], dep))
}
function defineReactive(obj, key, val, dep) {
    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: true,
        get() {
            dep.depend()
            return val
        },
        set(newVal) {
            val = newVal
            dep.notify()
        }
    })
}

// 将options.data上的属性代理到Vue实例上
function proxy(source, target) {
    Object.keys(source).forEach(key => {
        Object.defineProperty(target, key, {
            enumerable: true,
            configurable: true,
            get() {
                return source[key]
            },
            set(newVal) {
                source[key] = newVal
            }
        })
    })
}

const app = new Vue({
    data: {
        msg: 'Hello, Vue'
    },
    render() {
        console.log(this.msg)
    }
}) // Hello, Vue
app.msg = 'change msg'; // change msg