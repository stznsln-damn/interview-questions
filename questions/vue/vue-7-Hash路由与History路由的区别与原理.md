---
title: "Hash 路由与 History 路由的区别与原理"
category: "vue"
order: 7
---

# Hash 路由与 History 路由的区别与原理

## 核心要点

Hash 模式基于 `location.hash` + `hashchange` 事件，fragment 不发送到服务端，无需服务端配置。History 模式基于 `pushState`/`replaceState` + `popstate` 事件，URL 干净但需要服务端回退配置。

## Hash 模式原理

1. `#` 后面的 fragment 不发送到服务端，路由变化是纯前端行为
2. 修改 `location.hash` 改变 URL 但不触发页面刷新
3. hash 变化时触发 `hashchange` 事件，路由库监听并匹配组件渲染

```js
window.addEventListener("hashchange", () => {
  const path = location.hash.slice(1);
  // 匹配路由，渲染组件
});
```

## History 模式原理

1. `pushState(state, title, url)` 修改 URL 但不触发刷新，不发送请求
2. `replaceState` 替换当前历史记录
3. 浏览器前进/后退触发 `popstate` 事件

```js
history.pushState(null, "", "/about");

window.addEventListener("popstate", () => {
  const path = location.pathname;
  // 匹配路由，渲染组件
});
```

注意：`pushState`/`replaceState` 本身不触发 `popstate`，只有浏览器前进后退才触发。Vue Router 在调用 pushState 后主动执行路由匹配。

## 关键对比

| 维度       | Hash 模式                      | History 模式             |
| ---------- | ------------------------------ | ------------------------ |
| URL 形式   | `/#/path`                      | `/path`                  |
| 底层 API   | `location.hash` + `hashchange` | `pushState` + `popstate` |
| HTTP 请求  | hash 不发送到服务端            | 完整路径发送到服务端     |
| 服务端配置 | 不需要                         | 需要回退配置             |
| 兼容性     | IE8+                           | IE10+                    |
| SEO        | 不友好                         | 可配合 SSR/预渲染优化    |

## 服务端配置

History 模式下直接访问或刷新 `/about` 会向服务端请求该路径，无对应资源则 404。需配置回退：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

前端路由中需配置兜底 404：

```js
{ path: '/:pathMatch(.*)*', component: NotFound }
```

## 如何选择

- 后台管理系统、不关心 SEO → Hash 模式
- 面向用户、需要 SEO → History 模式
- 微前端子应用 → Hash 模式更安全

## 总结

1. Hash 模式基于 `hashchange`，fragment 不发送到服务端，零配置
2. History 模式基于 `pushState` + `popstate`，URL 干净，需服务端回退配置
3. `pushState` 不触发 `popstate`，Vue Router 在调用后主动执行路由匹配
4. History 模式刷新需 Nginx 配置 `try_files` 回退到 index.html
5. 两种模式对 Vue Router 上层 API 透明，切换只需改 history 配置
