---
title: "Hash 模式对 SEO 的影响与预渲染优化"
category: "engineering"
order: 3
---

# Hash 模式对 SEO 的影响与预渲染优化

## 核心要点

Hash 模式下 `#` 后的内容不发送到服务端，搜索引擎无法区分路由，所有页面被视为同一个空页面。History 模式解决 URL 问题但 SPA 仍返回空壳 HTML。预渲染在构建阶段将路由快照为静态 HTML，是改造成本最低的 SEO 方案。

## Hash 模式为什么影响 SEO

URL 中 `#` 后的 fragment 不包含在 HTTP 请求中。爬虫请求 `https://example.com/#/about` 时，服务端收到的是 `/`，返回空壳 HTML。

具体影响：

1. 所有路由共享一个 URL，无法被独立索引
2. JS 动态修改的 title 和 meta 在不执行 JS 的爬虫中不存在
3. 社交平台分享卡片无法正确抓取 OG 标签
4. sitemap.xml 中含 hash 的 URL 会被忽略

即使 Googlebot 能执行 JS，渲染有延迟且 hash 部分不作为独立 URL 索引。

## History 模式的局限

切换到 History 模式后每个路由是独立 URL，解决了 URL 层面的问题。但 SPA 服务端返回的仍是空壳 HTML，不执行 JS 的爬虫依然看不到内容。History 模式是必要条件，非充分条件。

## 预渲染方案

### 原理

构建阶段用无头浏览器（Puppeteer 等）访问每个路由，等待渲染完成后将 DOM 快照序列化为静态 HTML。部署时每个路由对应一份完整 HTML。

### 实现

```js
// vite.config.js
import prerender from "vite-plugin-prerender";

export default {
  plugins: [
    prerender({
      routes: ["/", "/about", "/contact", "/blog"],
      renderer: { renderAfterTime: 3000 },
    }),
  ],
};
```

### 适用场景

- 路由数量有限且可枚举（官网、文档站、博客）
- 页面内容相对静态，不依赖用户身份

### 不适用场景

- 路由动态生成（如 `/user/:id` 大量用户）
- 内容高度个性化
- 数据实时性要求高

## 预渲染 vs SSR vs SSG

| 维度       | 预渲染     | SSR       | SSG            |
| ---------- | ---------- | --------- | -------------- |
| 渲染时机   | 构建时     | 请求时    | 构建时         |
| 动态路由   | 不支持     | 支持      | 有限支持       |
| 数据实时性 | 构建时快照 | 实时      | 快照（可 ISR） |
| 服务端要求 | 静态托管   | Node 服务 | 静态托管       |
| 改造成本   | 低         | 高        | 中             |

## 补充 SEO 措施

1. 动态 Meta 管理：`vue-meta` 或 `@unhead/vue` 为每个路由设置独立 title、description
2. 自动生成 sitemap.xml，只含 History 模式真实 URL
3. 设置 `<link rel="canonical">` 避免重复内容
4. 添加 JSON-LD 结构化数据

## 总结

1. Hash 模式下 fragment 不发送到服务端，搜索引擎无法区分路由
2. History 模式解决 URL 问题，但 SPA 仍返回空壳 HTML
3. 预渲染在构建阶段用无头浏览器快照路由为静态 HTML，改造成本最低
4. 预渲染适合路由可枚举、内容静态的场景；动态路由多则选 SSR
5. 完整的 SEO 优化需配合 Meta 管理、Sitemap、Canonical URL、结构化数据
