---
title: "大文件分片上传与断点续传"
category: "javascript"
order: 4
---

# 大文件分片上传与断点续传

## 核心要点

大文件上传要解决两个问题：单次上传体积过大导致失败率高，以及失败后需从头重传的浪费。分片上传将文件切割为多个 chunk 并发上传，断点续传通过查询已传分片跳过重复传输。

## 分片上传

### 基本流程

1. 前端用 `File.prototype.slice()` 将文件按固定大小（通常 2~5MB）切割为多个 chunk
2. 每个 chunk 携带元信息（文件 hash、分片索引、总片数）并发上传
3. 服务端全部收到后按索引顺序合并还原完整文件

```js
function createChunks(file, chunkSize = 5 * 1024 * 1024) {
  const chunks = [];
  let cur = 0;
  while (cur < file.size) {
    chunks.push({
      index: chunks.length,
      blob: file.slice(cur, cur + chunkSize),
    });
    cur += chunkSize;
  }
  return chunks;
}
```

### 文件唯一标识

对文件内容做 hash 计算（MD5/SHA-256）作为唯一指纹。大文件直接计算会阻塞主线程，解决方案：

- **Web Worker**：在 Worker 中用 `spark-md5` 逐片计算增量 hash
- **抽样 hash**：对文件头尾和中间等间隔位置取样计算，牺牲精度换速度

### 并发控制

控制同时上传的分片数（通常 3~6 个），避免浏览器连接数饱和：

```js
async function uploadWithLimit(chunks, limit = 4) {
  const pool = new Set();
  for (const chunk of chunks) {
    const task = uploadChunk(chunk).then(() => pool.delete(task));
    pool.add(task);
    if (pool.size >= limit) {
      await Promise.race(pool);
    }
  }
  await Promise.allSettled(pool);
}
```

## 断点续传

上传前向服务端发送预检请求，查询已接收的分片索引列表，前端过滤后只上传缺失部分。

```js
async function resumableUpload(file) {
  const chunks = createChunks(file);
  const hash = await calcHash(file);

  const { uploaded } = await fetch(`/api/upload/check?hash=${hash}`).then((r) => r.json());

  const pending = chunks.filter((c) => !uploaded.includes(c.index));
  await uploadWithLimit(pending);

  await fetch("/api/upload/merge", {
    method: "POST",
    body: JSON.stringify({ hash, total: chunks.length }),
  });
}
```

前端可将进度存入 `localStorage`（key 为文件 hash），页面刷新后也能恢复状态。

## 秒传

文件 hash 发到服务端，发现已存在相同 hash 的完整文件则直接返回成功，并非真正上传。

## 工程细节

- **失败重试**：单个分片失败后自动重试 2~3 次，超过次数标记失败，不影响其他分片
- **进度展示**：通过 `XMLHttpRequest.upload.onprogress` 获取每个分片进度，汇总计算整体进度
- **暂停/恢复**：用 `AbortController` 取消进行中的请求，恢复时走断点续传逻辑
- **动态切片**：根据网络状况调整 chunk 大小，弱网时用更小切片降低单片失败概率
- **合并校验**：服务端合并后对完整文件做 hash 校验，确保与前端一致

## 总结

1. 分片上传用 `File.slice()` 切割文件，携带索引并发上传，服务端按序合并
2. 文件 hash 是整个方案的基石，建议在 Web Worker 中增量计算避免阻塞
3. 断点续传的关键是上传前查询已有分片，只传缺失部分
4. 秒传本质是 hash 比对，服务端已有则直接返回成功
5. 工程上需关注并发控制、失败重试、暂停恢复、进度汇总等细节
