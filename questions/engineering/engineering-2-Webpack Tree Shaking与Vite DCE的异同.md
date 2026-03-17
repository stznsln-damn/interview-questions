---
title: "Webpack Tree Shaking 与 Vite Dead Code Elimination 的异同"
category: "engineering"
order: 2
---

# Webpack Tree Shaking 与 Vite Dead Code Elimination 的异同

## 核心要点

Tree Shaking 基于 ESM 静态分析移除未引用的导出，DCE 由压缩工具移除不可达代码，两者互补。Webpack 分"标记 + Terser 删除"两步走，Vite 生产构建由 Rollup 一步到位只打包被引用的绑定。

## 概念区分

- **Tree Shaking**：模块级别，标记并移除未被引用的 exports
- **Dead Code Elimination**：代码级别，移除不可达代码（永假分支、未调用函数等），由 Terser/esbuild 在 minify 阶段完成

## Webpack 的 Tree Shaking

### 两阶段机制

1. **标记阶段**（Webpack）：分析 ESM import/export，标记未被引用的导出为 `unused harmony export`
2. **删除阶段**（Terser）：minify 时物理删除未使用的代码

必须 `mode: 'production'` 才能完整生效。

### sideEffects 配置

Webpack 默认保守——即使导出未被使用，仍保留模块顶层代码（可能有副作用）。`package.json` 中 `"sideEffects": false` 声明整个包无副作用，允许跳过未引用模块。可用数组精确指定有副作用的文件：

```json
{ "sideEffects": ["*.css", "./src/polyfill.js"] }
```

## Vite 的处理方式

### 开发阶段

不做 Tree Shaking。浏览器原生 ESM 按需加载，未 import 的模块不会被请求，天然模块级按需。

### 生产构建（Rollup）

Rollup 是 Tree Shaking 概念的提出者，实现更彻底：

- 直接只将被引用的绑定包含进输出，标记和删除一体化
- 对作用域和引用关系分析更精细，默认假设纯函数调用无副作用
- 输出后由 esbuild（默认）做最终 minify 和 DCE

## 对比

| 维度             | Webpack                    | Vite（Rollup）              |
| ---------------- | -------------------------- | --------------------------- |
| 实现方式         | 标记 + Terser 删除，两步走 | Rollup 直接只打包引用代码   |
| 默认效果         | 需 production 模式         | 生产构建默认启用            |
| sideEffects 依赖 | 强依赖声明                 | Rollup 分析更激进，依赖较弱 |
| 副作用处理       | 保守                       | 激进，`/*#__PURE__*/` 辅助  |
| DCE 工具         | Terser                     | esbuild 或 Terser           |
| CJS 支持         | 有限分析                   | 插件转换后支持              |

## 共同前提

1. 必须使用 ESM，import/export 可静态分析；CommonJS 的 require 是动态的
2. 避免模块顶层副作用代码
3. 可用 `/*#__PURE__*/` 标记纯函数调用

## 实际踩坑

- `export { foo } from './utils'` 比先 import 再 export 对 Tree Shaking 更友好
- 类一旦被引用，所有方法都保留（prototype 赋值是副作用）
- TypeScript enum 编译为 IIFE 被视为有副作用，可用 const enum 或字面量联合类型替代

## 总结

1. Tree Shaking 和 DCE 是互补关系，前者处理模块级未使用导出，后者处理代码级不可达代码
2. Webpack 两步走：自身标记 + Terser 删除；Rollup 一步到位只打包被引用的绑定
3. 两者都要求 ESM 格式，对副作用敏感
4. Webpack 更依赖 sideEffects 声明，Rollup 默认分析更激进
5. 注意 re-export 写法、class 方法、TypeScript enum 等影响效果的场景
