---
title: "dependencies、devDependencies、peerDependencies 的区别"
category: "engineering"
order: 4
---

# dependencies、devDependencies、peerDependencies 的区别

## 核心要点

`package.json` 中三个依赖字段分别对应不同的安装时机和使用场景：`dependencies` 用于运行时依赖，`devDependencies` 用于开发阶段依赖，`peerDependencies` 用于声明宿主项目需提供的依赖。

## 详细解释

### dependencies — 生产依赖

声明项目运行时必须的依赖包。无论是 Node.js 服务端还是浏览器端，只要代码 `import` 或 `require` 了该包，就属于 `dependencies`。

- `npm install` 默认安装
- 当别人安装你的包时，`dependencies` 会一起安装（传递性依赖）
- 典型：`vue`、`react`、`axios`、`lodash`、`express`

### devDependencies — 开发依赖

仅在开发、构建、测试阶段使用的依赖，不会出现在最终产物的运行时中。

- `npm install` 默认也会安装
- `npm install --production` 或 `NODE_ENV=production` 时跳过安装
- 当别人安装你的包时，`devDependencies` 不会被安装
- 典型：`webpack`、`vite`、`eslint`、`typescript`、`jest`、`@types/*`

### peerDependencies — 宿主依赖

声明当前包需要宿主项目提供的依赖，自身不安装，期望消费者项目中已经存在兼容版本。核心目的是避免重复安装和保证单例。

- npm v7+ 自动安装（版本冲突报 warning）
- npm v3 ~ v6 只发出 warning，不自动安装
- 典型：编写插件/组件库时，如 Vue 组件库声明 `"peerDependencies": { "vue": "^3.0.0" }`

### 三者对比

| 字段             | 安装时机           | 传递性             | 适用场景                     |
| ---------------- | ------------------ | ------------------ | ---------------------------- |
| dependencies     | 默认安装，生产也装 | 随包传递           | 运行时必须的库               |
| devDependencies  | 默认安装，生产不装 | 不传递             | 构建工具、类型声明、测试框架 |
| peerDependencies | 要求宿主提供       | 不传递，共用宿主的 | 插件、组件库                 |

## peerDependencies 的单例问题

以 React 组件库为例：如果把 `react` 放在 `dependencies` 而非 `peerDependencies`，安装后 `node_modules` 中可能出现两份 React 实例。React 依赖内部单例状态（如 Hooks 的 dispatcher），两份实例会导致运行时报错。`peerDependencies` 确保整个项目共用一份 React。

## peerDependenciesMeta

可将 peerDependency 标记为可选，避免宿主未安装时报错：

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "peerDependenciesMeta": {
    "react-dom": {
      "optional": true
    }
  }
}
```

## 应用项目 vs npm 包

对于应用项目（非发布到 npm 的包），`dependencies` 和 `devDependencies` 的区分更多是语义层面的。因为应用不会被别人 `npm install`，打包工具只看 `import` 关系。但保持正确分类仍有价值——生产部署 `npm install --production` 可以减少安装体积。

## 总结

1. `dependencies` 是运行时依赖，随包传递安装，适用于项目运行必须的库
2. `devDependencies` 是开发阶段依赖，生产环境和被安装时不装，适用于构建工具、类型声明、测试框架等
3. `peerDependencies` 是宿主依赖，要求消费者项目自行提供，避免重复安装和保证单例，适用于插件/组件库
4. 对应用项目，区分偏语义；对 npm 包，区分直接影响消费者的安装行为
5. `peerDependenciesMeta` 可将 peerDependency 标记为 optional，增加兼容弹性
