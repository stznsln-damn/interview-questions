---
title: "Vite 热更新（HMR）原理"
category: "engineering"
order: 1
---

# Vite 热更新（HMR）原理

## 核心要点

Vite HMR 基于原生 ESM + WebSocket 构建，整体流程：文件变更 → ModuleGraph 定位 → HMR 边界收集 → WebSocket 通知 → 浏览器按需拉取 → 模块替换执行。与 Webpack 的本质区别是不需要重新打包，更新速度与项目规模无关。

## 完整流程

### 1. 文件监听

Vite 启动时通过 chokidar 监听文件系统变更事件（change、add、unlink）。

### 2. ModuleGraph 查找

Vite 内部维护 ModuleGraph，记录模块间的双向引用关系（importers / importedModules）。文件变更后定位对应模块节点，将 `transformResult` 缓存置为 null。

### 3. HMR 边界收集

从变更模块沿 importers 链向上遍历，找到声明了 `import.meta.hot.accept()` 的模块即为 HMR 边界。找到则精确更新边界子树，找不到则 full reload。

`.vue` 文件开箱支持 HMR，因为 `@vitejs/plugin-vue` 编译时自动注入 accept 代码。

### 4. WebSocket 通知

服务端通过 WebSocket 推送更新指令，携带模块路径和时间戳：

```js
{ type: 'update', updates: [{ type: 'js-update', path: '/src/App.vue', timestamp: 1709876543 }] }
```

### 5. 浏览器拉取新模块

页面启动时注入的 `@vite/client` 监听 WebSocket，收到更新后用动态 `import()` 附加时间戳绕过缓存请求最新模块。Vite dev server 拦截请求，重新走 transform 管道返回新代码。

### 6. 模块替换执行

执行边界模块注册的 accept 回调。Vue SFC 的回调调用 `__VUE_HMR_RUNTIME__` 的 rerender 或 reload 方法实现组件级热替换。

## 不同文件类型的 HMR 策略

| 文件类型             | 更新策略                         |
| -------------------- | -------------------------------- |
| Vue SFC `<template>` | rerender，保留组件状态           |
| Vue SFC `<script>`   | reload 组件实例，状态丢失        |
| Vue SFC `<style>`    | CSS 热替换，无闪烁               |
| 普通 CSS             | 通过 link 标签 href 加时间戳刷新 |
| 纯 JS/TS             | 取决于是否有 accept 边界         |

## import.meta.hot API

- `accept()` — 接受自身或依赖更新
- `dispose(cb)` — 模块被替换前清理（移除事件监听、定时器等）
- `decline()` — 拒绝更新，强制 full reload
- `on()` — 监听自定义 HMR 事件

`import.meta.hot` 在生产构建时为 undefined，if 分支被 tree-shaking 移除。

## 与 Webpack HMR 的差异

| 维度     | Vite             | Webpack                  |
| -------- | ---------------- | ------------------------ |
| 模块格式 | 原生 ESM         | 自实现模块系统           |
| 更新粒度 | 单个模块文件     | 重新打包变更涉及的 chunk |
| 更新速度 | O(1)，与规模无关 | 随项目增大变慢           |

## 总结

1. 通过 chokidar 监听文件变更，在 ModuleGraph 中定位模块并使缓存失效
2. 沿 importers 链向上冒泡查找 HMR 边界，找不到则 full reload
3. 服务端通过 WebSocket 推送更新指令给 `@vite/client`
4. 浏览器用动态 import() 加时间戳重新请求模块，绕过缓存
5. Vue SFC 由插件自动注入 accept，模板变更 rerender 保留状态，script 变更 reload
6. 不需要重新打包，更新速度与项目规模无关
