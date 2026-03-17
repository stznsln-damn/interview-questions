---
title: "Vue3 和 Vue2 响应式原理的差别"
category: "vue"
order: 5
---

# Vue3 和 Vue2 响应式原理的差别

## 核心要点

Vue2 用 `Object.defineProperty` 逐属性劫持 getter/setter，Vue3 用 `Proxy` 代理整个对象拦截所有操作。这一底层差异导致两代响应式在能力边界、性能表现和 API 设计上的本质不同。

## 数据劫持方式

- **Vue2**：`Object.defineProperty` —— 对对象的每个属性逐一定义 getter/setter
- **Vue3**：`Proxy` —— 对整个对象进行代理，可拦截 13 种操作（get、set、has、deleteProperty、ownKeys 等）

## Vue2 的局限

1. **无法检测属性新增和删除**：`defineProperty` 只能劫持已存在的属性，动态添加的属性无响应性，需用 `Vue.set()` / `$set()`
2. **数组索引赋值和 length 修改无法检测**：Vue2 通过重写数组的 7 个变异方法（push、pop、splice 等）补丁解决
3. **初始化递归开销大**：深层嵌套对象需递归遍历每个属性，无论是否被访问
4. **不支持 Map、Set 等集合类型**

## Vue3 的改进

1. **属性增删自动响应**：set/deleteProperty trap 捕获所有操作，不再需要 `$set`
2. **数组操作天然支持**：索引赋值、length 修改都经过 proxy trap
3. **惰性递归（lazy reactive）**：不在初始化时递归，访问到嵌套对象时才递归代理，按需深入
4. **支持 Map、Set、WeakMap、WeakSet**：Vue3 为集合类型编写专门 handler

## 依赖收集的演进

**Vue2**：每个组件对应一个 Watcher，粒度在组件级别。任何响应式数据变化触发整个组件重新渲染，再通过 VNode diff 找差异。

**Vue3**：引入 `effect` + `ReactiveEffect` 体系：

- 全局 `WeakMap → Map → Set`（targetMap）存储依赖关系：target → key → effects
- `track()` 收集依赖，`trigger()` 触发更新
- 配合编译期 patchFlags 和 Block Tree，diff 时跳过静态节点，精确到动态绑定级别

## ref 与 reactive

Vue3 将响应式 API 拆分为 `ref` 和 `reactive`：

- `reactive`：Proxy 代理对象
- `ref`：对基本类型的包装，通过 getter/setter 劫持 `.value`（Proxy 无法代理原始值）

`ref` 需要 `.value` 是 JavaScript 语言限制的必然结果，非设计缺陷。

## 总结

1. Vue2 用 `Object.defineProperty` 逐属性劫持，Vue3 用 `Proxy` 代理整个对象
2. Vue2 无法检测属性增删和数组索引赋值，需要 `$set` 和变异方法补丁；Vue3 天然支持
3. Vue3 惰性递归，访问时才深层代理，初始化性能更优
4. Vue3 支持 Map/Set 等集合类型的响应式
5. 依赖收集从组件级 Watcher 演进为 effect 体系，配合编译优化实现更精确的更新
6. `ref` 的 `.value` 是对原始类型无法被 Proxy 代理的补偿设计
