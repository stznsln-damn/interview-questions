# Vue 3 中 v-model 的改进与 defineModel

## 核心要点

- **Vue 3 v-model 改进**：默认使用 `modelValue` + `update:modelValue`；支持多个 v-model（`v-model:propName`），取代 `.sync`；支持自定义修饰符（如 `modelModifiers`）。
- **defineModel**（Vue 3.4+）：编译期宏，自动生成“一个 prop + 对应 update 的 emit”，返回可写 ref，子组件直接读写即实现双向绑定，无需手写 prop + emit 样板代码。
- 单模型用 `defineModel()`，多模型用 `defineModel('name')`，可传选项（type、default、required、validator）。

## 详细解释

### Vue 3 中 v-model 的改进

1. **默认 prop/event 名**：Vue 2 固定为 `value` + `input`（或通过 `model` 选项改）；Vue 3 改为 `modelValue` + `update:modelValue`，便于与多 v-model 命名统一。
2. **多个 v-model**：父组件可写 `v-model="a"`、`v-model:title="title"` 等；子组件需为每个绑定提供对应 prop 和 `update:xxx` 事件。Vue 3 用 `v-model:propName` 替代了 `.sync`。
3. **自定义修饰符**：子组件通过 `modelModifiers` 或 `xxxModifiers` 拿到修饰符，在内部对值做处理后再写回。

### defineModel 的用法

- **默认（单模型）**：`const model = defineModel()`，得到可写 ref，模板中 `v-model="model"` 或脚本中 `model.value = xxx` 即完成双向绑定。
- **具名（多模型）**：`const title = defineModel('title')`、`const visible = defineModel('visible', { type: Boolean, default: false })`，父组件使用 `v-model:title`、`v-model:visible`。
- **选项**：可传 `{ type, default, required, validator }`，与 prop 选项一致；修饰符可在逻辑中通过 modelModifiers / xxxModifiers 处理。

### 与手写 prop + emit 的对比

手写需要：`defineProps(['modelValue'])`、`defineEmits(['update:modelValue'])`，在需要更新时 `emit('update:modelValue', value)`。defineModel 将“一个 prop + 一个 emit”合并为一次声明并返回 ref，代码更简洁，多 v-model 时优势更明显。

## 总结

1. Vue 3 默认 v-model 为 modelValue/update:modelValue；支持 v-model:propName 多模型与自定义修饰符。
2. defineModel 是编译期宏，返回可写 ref，读写即双向绑定，支持单模型、多模型和选项。
3. 使用 defineModel 后无需手写对应的 prop 与 emit，适合 Vue 3.4+ 项目。
