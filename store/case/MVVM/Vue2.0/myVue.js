let Watcher = null;

class Dep {
  constructor() {
    this.subs = [];
  }
  addSub(sub) {
    this.subs.push(sub);
  }
  notify() {
    this.subs.forEach(sub => sub.update());
  }
}

class Observer {
  constructor(data) {
    this.defineReactive(data);
  }
  
  defineReactive(data) {
    Object.keys(data).forEach(key => {
      const dep = new Dep();
      let value = data[key];

      if (typeof value === 'object') {
        new Observer(value);
      } else {
        Object.defineProperty(data, key, {
          get: () => {
            if (Watcher) {
              dep.addSub(Watcher);
            }
            return value;
          },
          set: (newVal) => {
            if (newVal === value) {
              return;
            }
            value = newVal;
            dep.notify();
          }
        })
      }
    })
  }
}

class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el); // 对外暴露
    this.$vm = vm;
    const fragment = this.node2Fragment(this.$el); // 将节点存到内存里面
    this.compile(fragment); // 编译fragment
    this.$el.appendChild(fragment); // 更新原来的DOM
  }
  node2Fragment(node) {
    const fragment = document.createDocumentFragment();
    // 遍历所以节点将其加入fragment中
    let child = null;
    while(child = node.firstChild) {
      fragment.appendChild(child);
    }
    return fragment;
  }

  // 编译文档碎片
  compile(fragment) {
    Array.from(fragment.childNodes).forEach(node => {
      // 编译文本节点
      if (this.isTextNode(node)) {
        this.compileText(node);
      }
      // 编译元素节点
      if (this.isElementNode(node)) {
        this.compileNode(node);
      }

      // 存在子元素的情况 递归
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    })
  }

  compileNode(node) {
    const attrs = [...node.attributes];
    attrs.forEach(attr => {
      let {name: attrName, value: attrValue} = attr;
      // attrName: v-model; attrValue: author.name.firstName
      // 处理v-开头的指令
      if (attrName.startsWith('v-')) {
        let directName = attrName.slice(2);
        switch(directName) {
          case 'model':
            new Watch(this.$vm, attrValue, (newValue) => {
              node.value = newValue;
            });
            node.addEventListener('input', e => {
              let oldValue = this._getValue(this.$vm, attrValue);
              let inputVal = e.target.value;
              if (inputVal !== oldValue) {
                // 更新视图
                this.__setValue(this.$vm, attrValue, inputVal);
              }
            });
            node.removeAttribute(attrName);
            break;
          
          case 'on:click':
            node.addEventListener('click', e => {
              this.$vm[attrValue]();
            });
            break;
        }
      }
    });
  }

  compileText(node) {
    const text = node.textContent;
    const reg = /\{\{(.+?)\}\}/;

    if (reg.test(text)) {
      const key = RegExp.$1.trim();
      node.textContent = this._getValue(this.$vm, key); // 将 {{ }} 中的属性值替换成 vm.data 中声明的值
      
      // 属性值替换完之后，向 dep 依赖中添加一个该属性对应的 Watcher
      new Watch(this.$vm, key, function(value) {
        node.textContent = value;
      });
    }
  }

  // 获取Vue data属性中的值
  _getValue(vm, exp) {
    let value = vm;
    exp = exp.split('.');
    exp.forEach(key => {
      value = value[key];
    })
    return value;
  }

  __setValue(vm, exp, value) {
    // 更新exp在vm实例中对应的值
    var val = vm;
    exp = exp.split('.');
    exp.forEach(function(k, i) {
        if (i < exp.length - 1) {
            val = val[k];
        } else {
            val[k] = value;
        }
    });
  }
  isTextNode(node) {
    return node.nodeType === 3;
  }

  isElementNode(node) {
    return node.nodeType === 1;
  }
}


class Watch {
  constructor(vm, exp, cb) {
    this.vm = vm;
    this.exp = exp;
    this.cb = cb;
    Watcher = this;
    this.oldValue = this._getValue(); // 获取vue实例上的值
    Watcher = null; // 释放 Watcher
  }

  update() {
    // 给属性set一个新值的时候，与当前的值对比一下
    let newValue = this._getValue();
    if (this.oldValue !== newValue) {
      // 更新旧值并执行回调
      this.oldValue = newValue;
      this.cb && this.cb(newValue);
    }
  }

  _getValue() {
    const keys = this.exp.split('.');
    let value = this.vm._data;
    keys.forEach(key => {
      value = value[key];
    })
    return value;
  }
}

class Vue {
  constructor(options) {
    const data = this._data = options.data || {};
    const methods = options.methods || undefined;
    const computed = options.computed || undefined;
    const watch = options.watch || undefined;
    this._proxyData(data); // 把data中的属性挂载到this上，例如data: { animal: 'cat' }, 在vue实例上可以用this.animal访问该属性
    this._proxyMethods(methods);
    this.__initComputed(computed);
    new Observer(data); // 劫持属性
    this.__initWatch(watch);
    new Compile(options.el, this);
  }

  _proxyData(data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => data[key],
        set: (newVal) =>data[key] = newVal,
      })
    })
  }

  _proxyMethods(methods) {
    if (typeof methods === 'object') {
      Object.keys(methods).forEach(key => {
        this[key] = methods[key];
      })
    }
  }

  __initComputed(computed) {
    if (typeof computed === 'object') {
      Object.keys(computed).forEach(key => {
        Object.defineProperty(this, key, {
          get: computed[key],
          set: () => {}
        });
      })
    }
  }

  __initWatch(watch) {
    if (typeof watch === 'object') {
      Object.keys(watch).forEach(key => {
        new Watch(this, key, watch[key]);
      })
    }
  }
}