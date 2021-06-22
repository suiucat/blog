项目文件概述: (来源: https://github.com/vuejs/vue/blob/dev/.github/CONTRIBUTING.md)
Vue: v2.6.14
├─dist // 包含用于分发的构建文件
├─examples //示例文件
├─flow // Flow类型声明文件
├─packages //  包含 vue-server-renderer 和 vue-template-compiler，它们作为单独的 NPM 包发布
├─scripts // 与构建相关的脚本和配置文件
│  └─alias.js // 模块导入所有源代码和测试中使用的别名
│  └─config.js // 所有文件的构建配置文件
├─src // 源代码
│  ├─compiler // 包含模板到渲染函数编译器的代码
│  │  ├─codegen // AST -> render函数
│  │  ├─directives // 生成render函数之前需要处理的指令
│  │  └─parser // template parser 模板解析
│  ├─core // 包含通用的、平台无关的运行时代码, Vue 2.0核心与平台无关
│  │  ├─components // 包含通用的抽象组件
│  │  ├─global-api // 包含 Vue 全局 api
│  │  ├─instance // 包含 Vue 实例构造函数和原型方法
│  │  ├─observer // 观察者: 包含与响应式系统相关的代码
│  │  ├─util // 工具函数
│  │  └─vdom // 包含与虚拟DOM元素创建和patch相关的代码
│  ├─platforms // 包含特定于平台的代码
│  │  ├─web // web独占文件
│  │  │  ├─compiler // 编译阶段的指令和模块处理
│  │  │  ├─runtime // 运行阶段的组件、指令和模块处理
│  │  │  ├─server // 与服务端渲染相关的代码
│  │  │  └─util // 工具函数
│  │  └─weex // weex独占文件
│  ├─server // 与服务端渲染相关的代码
│  ├─sfc // 包含单文件组件(*.vue文件)解析逻辑。
│  └─shared //  包含跨整个代码库共享程序
└─types // 包含TypeScript 类型定义
