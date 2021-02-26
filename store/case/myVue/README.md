# 实现一个MVVM框架
本文讲的是MVVM框架基本实现,一步一步实现一个简版的MVVM，以求深入理解,在开始之前，希望你有使用Vue2.x的经历。

1、让我们从最初的想法开始
  >总所周知，Vue2.x体现的MVVM模式实现是借用了[Object.defineproperty()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)和观察者模式来实现的。
  
  下面简单介绍一下 Object.defineProperty() 和观察者模式，如果你已经熟悉了，建议跳过这一段往下看。
  ```javascript
  // Object.defineproperty()
  const data = {
    title: 'Vue的基本原理实现'
  }
  let value = data['title'];
  Object.defineProperty(data, 'title', {
    get() => {
      console.log('get');
      return value;
    },
    set(newValue) => {
      console.log('set');
      if (newValue !== value) {
        value = newValue;
      }
    }
  })

  data.title = 'set操作'; // set
  data.title; // get
  /**
   * 上面的代码实现了一个简单的对data.title属性的劫持，
   * 当执行data.title = 'set操作'时，执行set()方法，执行data.title操作时，执行get()方法.
   * 
  */


  // 观察者模式
  class Dep {
    constructor() {
      this.subs = [];
    }
    addSub() {
      this.subs.push();
    }
    notify() {
      this.subs.forEach(sub => sub.update());
    }
  }

  const Watcher = {
    update: () => {
      console.log(`更新下数据`)
    }
  }

  const dep = new Dep();
  dep.addSub(Watcher);
  dep.notify(); // '更新下数据'
  /**
   * 上面的代码， 声明了一个 Dep 的实例 dep，然后添加了一个 Watcher, 
   * 接着调用 notify方法来执行 Watcher中的update方法。
   * /
  ```

  所谓的MVVM模式，主要的特点是视图和数据双向绑定，当视图变化，数据也要变化，同样地，
  数据变化时视图也要变化。比如现在有视图
  ```html
  <div id="root">
    <div>{{author.name.firstName}}</div>
  <div>
  ```
有数据对象
```javascript
  const data = {
    author: {
      firstName: 'suiu',
    }
  }
```
我们想要做到下图这个效果:
   ![gif1](./1.gif)

2、实现{{xxx}}语法
先贴下代码：
html:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue框架的基本原理</title>
</head>
<body>
  <div id="root">
    <div>{{author.name.firstName}}</div>
  <div>
  <script src="index.js"></script>
</body>
</html>

  ```

javascript:

index.js
  ```javascript
// 用于存放当前 Watch
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
        if (typeof value === 'object') { // 递归深层属性
          new Observer(value);
        } else {
          Object.defineProperty(data, key, {
            get: () => {
              if (Watcher) { // 当前的 Watch
                dep.addSub(Watcher);
              }
              return value;
            },
            set: (newVal) => {
              if (newVal === value) { // 只有新值才会赋值
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
      this.$vm = vm; // 对外暴露
      const fragment = this.node2Fragment(this.$el); // 将节点存到内存里面(这样做是为了提升性能，因为考虑到操作DOM可能导致的重绘和回流而使性能下降),
      this.compile(fragment); // 编译内存中 fragment文档片段
      this.$el.appendChild(fragment); // 更新原来的DOM
    }
    // 遍历所以节点将其加入fragment中
    node2Fragment(node) {
      const fragment = document.createDocumentFragment();
      
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
        // 存在子元素的情况 递归
        if (node.childNodes && node.childNodes.length > 0) {
          this.compile(node);
        }
      })
    }

    // 编译文本节点
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

    isTextNode(node) {
      return node.nodeType === 3;
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
      this._proxyData(data);
      new Observer(data); // 劫持属性
      new Compile(options.el, this); // 编译模板
    }

    _proxyData(data) {
      Object.keys(data).forEach(key => {
        Object.defineProperty(this, key, {
          get: () => data[key],
          set: (newVal) =>data[key] = newVal,
        })
      })
    }
  }

  const vm = new Vue({
    el: '#root',
    data: {
        author: {
          name: {
            firstName: 'suiu',
          },
        },
    },
  })
  window.vm = vm;

  // 测试
  let val = 1;
  setInterval(() => {
    vm.author.name.firstName = val++;
  }, 1000);

  ```
看到这里，可能代码有点多，但是权衡之下，我还是要这样写，因为我想一步一步讲实现思路，便于读者更好理解。




先看这段代码：
```javascript
  class Vue {
    constructor(options) {
      const data = this._data = options.data || {};
      this._proxyData(data);
      new Observer(data); // 劫持属性
      new Compile(options.el, this); // 编译模板
    }

    _proxyData(data) {
      Object.keys(data).forEach(key => {
        Object.defineProperty(this, key, {
          get: () => data[key],
          set: (newVal) =>data[key] = newVal,
        })
      })
    }
  }

  const vm = new Vue({
    el: '#root',
    data: {
        author: {
          name: {
            firstName: 'suiu',
          },
        },
    },
  })

```
首先是new Vue(), 依次进行了三个操作
  1、this._proxyData();
  2、new Observer();
  3、new Compile();

this._proxyData()实现的是data属性的代理，方便我们操作。

new Observer()做的事情是数据劫持，为每一个劫持的属性对应一个Dep实例对象, 然后在Object.defineProperty遍历属性的get()中，如果有Watcher就把Watcher添加到依赖中, 在set()中去执行dep.notify(); 可能读者会有疑惑为什么get()的时候要判断一下Watcher ?, 其实这很巧妙,通过一个全局 Watcher 变量来控制正在执行的data属性添加依赖（这里要强调正在执行）

new Compile()依次做了下面几个操作:
  1、通过node2Fragment()函数, 将绑定的this.$el文档存入内存中(这样做的目的是减少DOM操作可能带来的重绘和回流导致的性能消耗)。

  2、compile()函数解析内存中的fragment, 判断节点的类型，如果是文本节点，通过正则表达式找到DOM节点{{xxx}}中的xxx属性，然后将new Vue() 传入的对应data.xxx属性的值取出,然后将{{xxx}}替换成data.xxx的属性值，最后在new Watch()中传入一个回调函数cb。 这里值得一提的是，在new Watch()的过程中，先将之前的全局Watcher指向现在new Watch()实例，然后调用_getValue()进行一个get()操作，将当前Watch实例添加到了dep依赖中，然后释放全局Watcher。这样一来，等我们后续给data.xxx属性赋值新的值时，就会触发set(), 来执行之前get()时传入的回调函数cb, 以此来更新视图。

  3、fragment替换完后，然后重新加入到原来绑定的元素中,这时页面已经更新。

总结：
  本文的通过讲解Observer、Compile、Watcher, 一步一步来描述MVVM双向绑定的具体实现。(后续还会实现v-model, watch特性，具体请看本目录下源码)