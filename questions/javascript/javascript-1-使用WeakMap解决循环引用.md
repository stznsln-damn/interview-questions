---
title: "如何使用 WeakMap 解决循环引用？"
category: "javascript"
order: 1
---

# 如何使用 WeakMap 解决循环引用？

## 先理解问题：什么场景会出现循环引用

最经典的场景是深拷贝。当对象存在循环引用时，递归拷贝会无限调用导致栈溢出：

```js
const obj = { name: "foo" };
obj.self = obj; // 循环引用

JSON.parse(JSON.stringify(obj)); // TypeError: Converting circular structure to JSON
```

## 为什么选 WeakMap

解决循环引用的核心思路：记录已经拷贝过的对象，遇到重复的直接返回之前的拷贝结果。用普通 Map 也能实现，但 WeakMap 有两个关键优势：

1. **键必须是对象** — 正好契合"用原始对象作为键"的需求
2. **弱引用，不阻止 GC** — 当原始对象不再被使用时，WeakMap 中的记录自动回收，避免内存泄漏

## 核心实现：带循环引用处理的深拷贝

```js
function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== "object") return target;

  // 命中缓存，说明出现循环引用，直接返回之前的拷贝
  if (map.has(target)) return map.get(target);

  const clone = Array.isArray(target) ? [] : {};

  // 关键：必须在递归之前存入
  map.set(target, clone);

  for (const key in target) {
    if (target.hasOwnProperty(key)) {
      clone[key] = deepClone(target[key], map);
    }
  }

  return clone;
}
```

## 执行流程（以循环引用为例）

```text
obj = { name: 'foo', self: obj }

第1次调用: deepClone(obj)
  → map 中无 obj → 创建 clone = {}
  → map.set(obj, clone)
  → 遍历 key='name': deepClone('foo') → 返回 'foo'
  → 遍历 key='self': deepClone(obj)
      → map 中有 obj → 直接返回 clone
  → 结束，clone = { name: 'foo', self: clone }  ✅
```

## WeakMap vs Map 对比

| 特性         | WeakMap                        | Map              |
| ------------ | ------------------------------ | ---------------- |
| 键类型       | 仅对象                         | 任意             |
| GC 行为      | 键是弱引用，不阻止回收         | 强引用，阻止回收 |
| 深拷贝完成后 | 原对象无外部引用时缓存自动清除 | 需手动 clear()   |

## 总结

1. **循环引用的本质问题**：递归过程中重复访问同一对象导致无限递归
2. **解决思路**：用"已访问表"记录处理过的对象，遇到重复直接返回缓存
3. **选择 WeakMap 的原因**：键为弱引用，深拷贝完成后不会阻止原对象被 GC 回收，避免内存泄漏
4. **关键细节**：必须在递归子属性之前将当前对象存入 WeakMap，否则无法拦截循环
