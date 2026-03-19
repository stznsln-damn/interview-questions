# 如何取消重复请求？

## 核心要点

- **取消已发出的重复/旧请求**：用 AbortController，在发新请求前对上一次 `abort()`，新请求携带新的 `signal`。
- **从源头不重复发**：请求去重（相同 key 共享一个进行中的 Promise）、防抖（减少调用次数）。
- 被取消的请求会抛出错误，通过 `error.name === 'AbortError'` 识别并静默处理。

## 详细解释

### AbortController 取消上一次请求

同一操作被快速触发多次时，保留“最后一次”请求，取消之前的未完成请求：

1. 每次发起新请求前，对上一次的 `AbortController` 调用 `abort()`。
2. 新建 `AbortController`，将 `signal` 传入 `fetch(options)` 或 axios 的 config。
3. 被取消的请求会 reject，`error.name === 'AbortError'` 表示被取消，可忽略不当作业务错误。

适用：搜索联想、tab 切换加载、翻页等“只关心最后一次”的场景。

### 请求去重（相同请求只发一次）

相同参数在短时间内被多次调用时，只发一次请求，其余调用复用同一个 Promise：

- 用请求 key（如 `method + url + 序列化参数`）做 key。
- 若该 key 已有进行中的 Promise，直接返回该 Promise；否则发起请求并缓存 Promise，完成后移除。
- 可与 AbortController 结合：只保留最新一次并取消旧的，或不做取消仅共享结果。

### 防抖减少触发

在调用请求的函数外层加防抖，连续触发时只执行最后一次，从源头减少请求次数。不直接“取消请求”，但能明显减少重复请求。适合输入框搜索、窗口 resize 等。

### 概念区分

- **取消重复请求**：不重复发或取消已发出的重复/旧请求（AbortController + 去重/防抖）。
- **取消请求**：取消某一次请求（AbortController）。
- **重复请求重试**：失败后重试，与“取消重复”是不同场景。

## 总结

1. AbortController 用于取消上一次或指定请求，新请求前 `abort()` 上一次，新请求带新 `signal`。
2. 请求去重用 key 缓存进行中的 Promise，相同 key 只发一次，复用结果。
3. 防抖在调用侧减少触发，从源头降低重复请求。
4. 取消导致的错误用 `error.name === 'AbortError'` 识别并静默处理。
