# 如何在 Vue 项目中实现动态路由？

## 核心要点

- 动态路由指根据权限/角色或后端配置在**运行时**通过 `addRoute`（Vue Router 4）或 `addRoutes`（3.x）注入的路由，而不是在创建 router 时全部写死。
- 流程：路由拆成静态 + 动态 → 获取权限/菜单 → 转成路由配置（component 用动态 import）→ 在 beforeEach 中 addRoute → 再执行一次 `next(to.fullPath)` 以匹配新路由。
- 404 或 catch-all 必须在所有动态路由添加完之后再 add；菜单与动态路由共用同一份数据，保证权限一致。
- **退出登录清空权限路由**：添加动态路由时记录每条路由的 `name`；登出时遍历并调用 `router.removeRoute(name)`，再清空权限/标记并跳转登录，只保留固定路由。

## 详细解释

### 核心 API

- Vue Router 4：`router.addRoute(route)` 添加单条；可 `addRoute(parentName, route)` 挂到父路由下；多条则循环调用。
- Vue Router 3：`router.addRoutes(routes)` 一次添加多条。

### 实现流程

1. **路由拆分**：静态路由（登录、404、重定向）在 `createRouter` 时写死；需要权限的页面不写死，留作“动态路由”。
2. **获取可访问路由**：从后端接口拿菜单/权限，或在前端根据角色过滤本地路由表，得到当前用户可访问的路由列表。
3. **数据转路由配置**：将 path、name、component 名、children 等转成 `RouteRecordRaw[]`；`component` 用 `() => import('@/views/xxx.vue')` 等形式做动态加载，可递归处理 children。
4. **注入时机**：在全局前置守卫 `beforeEach` 中判断“已登录且动态路由未注入”时：调接口或读本地 → 转换 → 循环 `addRoute` → 最后 add 404 → 标记已注入 → `next(to.fullPath)` 或 `next({ ...to, replace: true })`，让本次导航重新匹配到新加的路由。
5. **404 与未登录**：404/catch-all 必须最后添加；未登录访问需权限 path 时重定向到登录，登录后再执行注入并 next 一次。

### 注意点

- 注入后必须**再进一次路由**（next 到当前 to），否则本次跳转不会匹配到刚添加的路由。
- 刷新不重新拉权限时，可将路由配置或权限列表存 store/本地，刷新后先恢复再 addRoute，避免闪屏。

### 与菜单联动

用同一份“可访问路由”数据既做 `addRoute` 又渲染侧栏/菜单，保证路由与菜单、权限一致。

### 退出登录后清空权限路由

登出后只保留固定路由、去掉所有动态添加的权限路由，做法如下：

1. **添加时记录 name**：在 `addRoute` 时把每条动态路由的 `name`（含 children 递归）存入数组或 store，便于登出时按 name 删除。
2. **登出时移除**：Vue Router 4 提供 `router.removeRoute(name)`。在登出逻辑中遍历记录的 name 列表，逐个 `removeRoute(name)`，再清空该列表和“已注入”标记，清 token/权限，最后 `router.push('/login')`。
3. **注意**：动态路由必须有唯一 `name` 才能被移除；先删路由再清权限再跳转，避免残留；若登出会清掉本地缓存的权限/路由，刷新后也不会恢复动态路由。

## 总结

1. 使用 addRoute/addRoutes 在运行时注入路由，静态与动态分离。
2. 在 beforeEach 中：拉权限 → 转成路由（component 动态 import）→ addRoute → 再 next(to.fullPath) 或 next({ ...to, replace: true })。
3. 404 最后 add；菜单与动态路由共用数据源。
4. 登出时用记录的 name 列表逐个 `removeRoute(name)`，清空权限与标记后跳转登录，只保留固定路由。
