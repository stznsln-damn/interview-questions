---
title: "为何 setup() 中直接解构 props 会丢失响应性？"
category: "vue"
order: 1
---

# 为何 setup() 中直接解构 props 会丢失响应性？

## 核心原因

`props` 是一个 Reactive 对象（由 `shallowReactive()` 包装），其响应性依赖于属性访问时的 getter 拦截。解构操作本质上是将值从对象中取出赋给普通变量，切断了与原始响应式对象的联系。

## 详细解释

### 1. props 的响应性本质

Vue 3 中 `props` 底层通过 `shallowReactive()` 创建。响应性追踪发生在通过 Proxy 访问属性的那一刻（触发 getter → 收集依赖）。

### 2. 解构发生了什么

```js
setup(props) {
  const { name, count } = props
  // 等价于：
  // const name = props.name   → 读了一次 getter，拿到当前原始值
  // const count = props.count  → 同上
}
```

- 如果 `props.name` 是字符串 `"hello"`，那么 `name` 就是普通字符串 `"hello"`
- 后续 `props.name` 变化时，`name` 仍是 `"hello"`，因为基本类型是值拷贝

### 3. 本质区别

| 方式                     | 每次渲染/计算时                           | 响应性 |
| ------------------------ | ----------------------------------------- | ------ |
| `props.name`             | 通过 Proxy getter 访问 → 触发依赖收集     | 有     |
| `const { name } = props` | 只在解构时读了一次 getter，后续是普通变量 | 无     |

## 正确做法：使用 toRefs / toRef

```js
setup(props) {
  const { name, count } = toRefs(props)
  // name.value 实际访问的是 props.name → 仍经过 Proxy → 响应性保留

  // 单独转一个
  const name = toRef(props, 'name')
}
```

`toRef` 简化原理：

```js
function toRef(obj, key) {
  return {
    get value() {
      return obj[key]; // 每次读 .value 都走 obj 的 Proxy getter
    },
    set value(val) {
      obj[key] = val;
    },
  };
}
```

## 总结

1. **props 是 Reactive 对象**，响应性依赖 Proxy 的 getter 拦截
2. **解构 = 一次性读值赋给普通变量**，基本类型是值拷贝，后续与源对象断开
3. **核心矛盾**：响应性需要"每次都经过 Proxy 访问"，解构后变量不再经过 Proxy
4. **解决方案**：`toRefs()` / `toRef()` 包装成 ref，内部通过 getter 代理回原对象
