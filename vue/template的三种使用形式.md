相关源码:
```javascript
function query (el: string | Element): Element {
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})
// 缓存原型上的$mount
const mount = Vue.prototype.$mount

Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 拿到挂载元素
  el = el && query(el)

  // 挂载元素不能是 body 和 document 节点
  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          // 例如：模板是 template: '#temp' 就匹配DOM上的 id节点: <div id="temp"> <span>111</span> </div>
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        // 模板是元素节点， 直接取元素节点的内容
        // template: document.querySelector('#temp') DOM: <div id="temp"> <span>111</span> </div> 取 <span>111</span>
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 没有模板就以el为基础创建一个模板
      template = getOuterHTML(el)
    }
  }
  return mount.call(this, el, hydrating)
}

```

// 模板为字符串
```html
  <div id="root"></div>

  <script>
    const vm = new Vue({
      el: '#root',
      template: '<div>{{msg}}</div>',
      data: {
        msg: '测试用例12222',
      },
    })
  </script>
```

// 模板为选择器匹配符(x-template 需要定义在 Vue 所属的 DOM 元素外。)
```html
  <div id="root">
  </div>
  <script type="text/x-template" id="tep">
    <p>Hello</p>
  </script>
  <script>
    const vm = new Vue({
      el: '#root',
      template: '#tep',
      data: {
        msg: '测试用例12222',
      },
    })
  </script>
```

// 内联模板 模板为DOM元素(内联模板需要定义在 Vue 所属的 DOM 元素内。)
```html
  <div id="root">
    <div id="tep"> <span>{{msg}}</span></div>
  </div>

  <script>
    const vm = new Vue({
      el: '#root',
      template: document.querySelector('#tep'),
      data: {
        msg: '测试用例12222',
      },
    })
  </script>
```