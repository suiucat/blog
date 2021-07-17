初始化Vue构造函数的时候，在initGlobalAPI()函数定义的Vue.options
```javascript
// src/core/global-api/index.js
const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]

const builtInComponents = {
  KeepAlive
}

Vue.options = Object.create(null)
ASSET_TYPES.forEach(type => {
  Vue.options[type + 's'] = Object.create(null)
})
...
  extend(Vue.options.components, builtInComponents)
...

```

```javascript
// src/platforms/web/runtime/index.js

// Vue指令 v-model, v-show
const platformDirectives = {
  model: {
    inserted: () => {},
    componentUpdated: () => {}
  },
  show: {
      bind: () => {},
      update: () => {},
      unbind: () => {}
  }
}
// Vue组件
const platformComponents = {
  Transition: Transition,
  TransitionGroup: TransitionGroup
};

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)
```

```javascript
Vue.options: {
  components: {KeepAlive: {…}, Transition: {…}, TransitionGroup: {…}}
  directives: {model: {…}, show: {…}}
  filters: {}
  _base: ƒ Vue(options)
}
```
