# setup 函数中同步修改响应式数据，会触发子组件的 onBeforeUpdate 吗？

## 结论：不会

在 setup() 中同步修改响应式数据，不会触发 onBeforeUpdate，甚至不会触发当前组件自身的 onBeforeUpdate。

## 原因分析

### 1. onBeforeUpdate 的触发前提

onBeforeUpdate 的语义是"组件即将因为响应式数据变化而重新渲染"。触发条件：

- 组件已经完成首次渲染（mounted）
- 响应式数据发生变化，触发了重新渲染

setup() 执行时组件还处于初始化阶段，首次渲染都没发生，不存在"重新渲染"概念。

### 2. setup 中的修改会被首次渲染"吸收"

```js
setup() {
  const count = ref(0)
  count.value = 1
  count.value = 2
  // 首次渲染时读到的就是最终值 2，不存在 0→1→2 的更新过程
  return { count }
}
```

setup() 同步执行完毕后才进行首次 render，这些修改是在初始化阶段确定初始状态，不是"更新"。

### 3. 渲染 effect 尚未创建

setup() 阶段渲染 effect 尚未创建（要等 setup 返回后才创建），数据变化时没有 effect 可以通知，没有更新任务被调度。

### 4. 子组件也不会触发

- 父组件都没完成首次渲染，子组件尚未创建
- 首次渲染时子组件拿到的就是最终值，走 mount 流程而非 update 流程

## 完整生命周期对照

```text
setup()                    ← 修改数据只是改变初始值
  ↓
onBeforeMount()
  ↓
render()                   ← 首次渲染，读取最终值
  ↓
  子组件 setup → onBeforeMount → render → onMounted
  ↓
onMounted()
  ↓
--- 此后修改数据才会触发 ---
  ↓
onBeforeUpdate()           ← 数据变化导致重新渲染前
  ↓
render()
  ↓
  子组件 onBeforeUpdate → render → onUpdated
  ↓
onUpdated()
```

## 总结

1. **onBeforeUpdate 触发前提**是组件已完成首次渲染后因数据变化需要重新渲染，setup 阶段不满足条件
2. **setup 中同步修改被首次渲染吸收**，渲染函数直接读取最终值，不存在"更新"过程
3. **渲染 effect 在 setup 之后才创建**，setup 执行期间数据变化无法触发更新调度
4. **子组件在父组件首次渲染时才创建**，走 mount 流程而非 update 流程
