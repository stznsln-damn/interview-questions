---
title: "Vue2 中，为什么在 beforeCreate 阶段无法访问 data？"
category: "vue"
order: 2
---

# Vue2 中，为什么在 beforeCreate 阶段无法访问 data？

## 直接原因

Vue2 的初始化流程中，data 的初始化（`initState`）发生在 `beforeCreate` 之后、`created` 之前。在 `beforeCreate` 触发时，data/props/methods/computed/watch 都还没有被处理。

## Vue2 实例初始化流程

`_init` 方法的关键执行顺序：

```text
new Vue()
  │
  ├── mergeOptions()            // 合并配置项
  ├── initLifecycle()           // 初始化 $parent, $children, $refs 等
  ├── initEvents()              // 初始化事件系统
  ├── initRender()              // 初始化 $slots, $createElement
  │
  ├── callHook('beforeCreate')  ← data/props/methods 均未初始化
  │
  ├── initInjections()          // 处理 inject
  ├── initState()               // 依次初始化 props → methods → data → computed → watch
  ├── initProvide()             // 处理 provide
  │
  ├── callHook('created')       ← data/props/methods 已可访问，DOM 未挂载
  │
  └── vm.$mount()               // 开始挂载
```

## 为什么要这么设计

1. **beforeCreate 的定位**：实例刚创建，只完成基础框架搭建。用途是在数据初始化前做前置操作，如插件注入（Vue Router、Vuex 都在此钩子通过 `Vue.mixin` 注入）
2. **initState 有依赖顺序**：props → methods → data → computed → watch，因为 data 中可能引用 props，computed 依赖 data，watch 监听 computed
3. **为插件预留时机**：如果 beforeCreate 之前就初始化 data，插件就无法在数据初始化前介入

## 各钩子可访问内容速查

| 钩子         | data/props/methods | computed/watch | $el (DOM) |
| ------------ | ------------------ | -------------- | --------- |
| beforeCreate | ❌                 | ❌             | ❌        |
| created      | ✅                 | ✅             | ❌        |
| beforeMount  | ✅                 | ✅             | ❌        |
| mounted      | ✅                 | ✅             | ✅        |

## 总结

1. **根本原因**：Vue2 的 `_init` 流程中，`beforeCreate` 在 `initState()` 之前调用，此时 data/props/methods 均未初始化
2. **初始化顺序**：initLifecycle → initEvents → initRender → **beforeCreate** → initState → **created**
3. **设计意图**：为插件提供"数据初始化前"的介入时机
4. **实际开发**：需要访问 data 的逻辑至少放在 created 中，需要操作 DOM 则放在 mounted
