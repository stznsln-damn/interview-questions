---
title: "Vue.use 注册插件机制"
category: "vue"
order: 6
---

# Vue.use 注册插件机制

## 核心要点

`Vue.use` 是 Vue 的插件注册入口，内部做三件事：去重检查、组装参数、调用 install 方法。Vue3 将其改为 `app.use()`，实现应用级隔离。

## 调用规范

```js
Vue.use(plugin, ...options);
```

- `plugin` 可以是带 `install` 方法的对象，或直接是一个函数
- 后续参数作为额外选项传给 `install`

## Vue2 内部实现

```js
Vue.use = function (plugin, ...options) {
  const installed = this._installedPlugins || (this._installedPlugins = []);
  if (installed.includes(plugin)) return this;

  if (typeof plugin.install === "function") {
    plugin.install(this, ...options);
  } else if (typeof plugin === "function") {
    plugin(this, ...options);
  }

  installed.push(plugin);
  return this;
};
```

核心三步：

1. 维护 `_installedPlugins` 数组，已存在则跳过，避免重复安装
2. 将 `Vue` 构造函数作为第一个参数，拼接用户 options
3. 调用 `plugin.install(Vue, ...options)` 或 `plugin(Vue, ...options)`

## 插件能做什么

`install` 接收 Vue 构造函数，通过它扩展全局能力：

- `Vue.component()` — 注册全局组件
- `Vue.directive()` — 注册全局指令
- `Vue.mixin()` — 注入全局混入
- `Vue.prototype.$xxx` — 挂载实例方法
- `Vue.filter()` — 注册全局过滤器（Vue2 独有）

## Vue3 的变化

Vue3 移除 `Vue.use()`，改为应用实例上调用：

```js
const app = createApp(App);
app.use(plugin, ...options);
```

关键差异：

1. **install 接收 app 实例**：`install(app, options)`，不再是全局构造函数
2. **实例属性挂载方式**：`Vue.prototype.$xxx` 改为 `app.config.globalProperties.$xxx`
3. **作用域隔离**：每个 `createApp()` 创建独立应用实例，插件只影响当前 app，不污染全局
4. **新增 provide**：`app.provide()` 可通过依赖注入向所有组件提供服务

```js
const LoadingPlugin = {
  install(app, options = {}) {
    app.component("VLoading", LoadingComponent);
    app.config.globalProperties.$loading = {
      /* ... */
    };
    app.provide("loading", loadingService);
  },
};
```

## 为什么用 Vue.use 而非直接调 install

- 自动去重，多次调用不会重复安装
- 统一入口，便于追踪和调试

## 总结

1. `Vue.use` 内部做三件事：去重检查 → 组装参数 → 调用 install
2. 插件可以是带 `install` 方法的对象，也可以直接是函数
3. Vue2 中 `install` 接收 Vue 构造函数，通过它注册全局组件、指令、混入、原型方法
4. Vue3 改为 `app.use()`，install 接收 app 实例，实现应用级隔离
5. Vue3 挂载实例属性改用 `app.config.globalProperties`，并新增 `app.provide` 注入依赖
