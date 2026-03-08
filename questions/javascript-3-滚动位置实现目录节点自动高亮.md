# 根据滚动位置实现目录节点自动高亮

## 核心要点

根据滚动位置高亮目录节点，本质是判断"当前视口中用户正在阅读哪个章节"，确定章节后高亮对应目录项。主流方案有两种：scroll 事件 + `getBoundingClientRect` 和 `IntersectionObserver`。

## 方案一：scroll 事件 + getBoundingClientRect

监听容器 `scroll` 事件，遍历所有标题元素，通过 `getBoundingClientRect()` 获取标题相对视口的位置，找出当前最接近视口顶部的标题。

```js
const headings = document.querySelectorAll("h1, h2, h3");
const tocItems = document.querySelectorAll(".toc-item");

function onScroll() {
  let currentId = "";
  for (const heading of headings) {
    const rect = heading.getBoundingClientRect();
    if (rect.top <= 80) {
      currentId = heading.id;
    }
  }
  tocItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.target === currentId);
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
```

关键细节：

- 阈值（如 80px）通常对应固定头部高度，按实际布局调整
- scroll 事件触发频率极高，必须用 `requestAnimationFrame` 或 `throttle` 节流
- 加 `{ passive: true }` 告知浏览器不会调用 `preventDefault`，有利于滚动性能

## 方案二：IntersectionObserver（推荐）

利用浏览器原生 `IntersectionObserver` API 观察标题元素与视口的交叉状态，无需手动监听 scroll，性能更优。

```js
const headings = document.querySelectorAll("h1, h2, h3");
const visibleHeadings = new Set();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        visibleHeadings.add(entry.target.id);
      } else {
        visibleHeadings.delete(entry.target.id);
      }
    });
    for (const heading of headings) {
      if (visibleHeadings.has(heading.id)) {
        highlightTocItem(heading.id);
        break;
      }
    }
  },
  {
    rootMargin: "-80px 0px -60% 0px",
    threshold: 0,
  },
);

headings.forEach((h) => observer.observe(h));
```

关键细节：

- `rootMargin: '-80px 0px -60% 0px'`：顶部偏移 80px 避开固定头部，底部收缩 60%，只有进入视口上部 40% 区域的标题被认为"正在阅读"
- 用 `Set` 维护可见标题集合，多个标题同时在视口中时取文档流最靠前的
- 浏览器内部优化回调执行，不阻塞主线程

## 两种方案对比

| 维度       | scroll + getBoundingClientRect | IntersectionObserver        |
| ---------- | ------------------------------ | --------------------------- |
| 性能       | 需手动节流，频繁触发重排       | 浏览器内部优化，异步回调    |
| 代码复杂度 | 较低，逻辑直观                 | 略高，需理解 Observer 模式  |
| 精确度     | 高，可精确计算像素级位置       | 依赖阈值配置，粗粒度        |
| 兼容性     | 全兼容                         | IE 不支持，现代浏览器均支持 |

## 工程补充考量

1. **点击跳转锁定**：点击目录项触发滚动时，临时禁用滚动监听或加锁，避免高亮项频繁跳动
2. **动态内容**：SPA 路由切换等场景下，内容更新后需重新收集标题并重建 Observer
3. **嵌套层级高亮**：多级目录中，高亮 h3 时其父级 h2 也应标记为激活状态
4. **边界处理**：页面滚动到底部时，即使最后一个标题未到达阈值，也应高亮最后一个目录项

## 总结

1. 核心思路是根据滚动位置判断"当前正在阅读哪个章节"，高亮对应目录项
2. 传统方案用 scroll 事件 + `getBoundingClientRect` 逐个比较标题位置，需配合节流优化
3. 推荐方案用 `IntersectionObserver` 观察标题与视口交叉状态，性能更优、代码更声明式
4. 关键参数是 `rootMargin` 和阈值，用于定义"阅读区域"的判定范围
5. 工程中需额外处理点击跳转锁定、动态内容重建、多级目录联动、底部边界等场景
