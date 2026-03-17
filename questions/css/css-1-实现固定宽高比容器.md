---
title: "实现固定宽高比容器"
category: "css"
order: 1
---

# 实现固定宽高比容器

## 核心要点

实现固定宽高比容器的关键是让高度随宽度按比例联动。现代方案用 `aspect-ratio` 一行解决，经典方案利用 padding 百分比相对宽度计算的特性模拟。

## 方案一：aspect-ratio 属性（推荐）

CSS 原生属性，一行代码：

```css
.container {
  width: 100%;
  aspect-ratio: 16 / 9;
}
```

浏览器根据宽度自动计算高度。若同时设置了 `width` 和 `height`，显式尺寸优先，`aspect-ratio` 退为建议值。兼容 Chrome 88+、Firefox 89+、Safari 15+。

## 方案二：padding-top 百分比（经典 hack）

利用 CSS 规则：**padding 的百分比值始终相对于包含块的宽度计算**。

```css
.container {
  width: 100%;
  height: 0;
  padding-top: 56.25%; /* 9 / 16 = 0.5625 */
  position: relative;
}

.container > .content {
  position: absolute;
  inset: 0;
}
```

原理：

1. `height: 0` 消除内容高度干扰，视觉高度完全由 padding 撑开
2. `padding-top: 56.25%` 相对父元素宽度计算，宽度变化时等比联动
3. 内容通过绝对定位铺满容器

## 方案三：calc() + viewport 单位

```css
.container {
  width: 80vw;
  height: calc(80vw * 9 / 16);
}
```

仅适用于宽度与视口直接挂钩的场景，局限性大。

## 方案对比

| 方案           | 优势                   | 劣势                             |
| -------------- | ---------------------- | -------------------------------- |
| `aspect-ratio` | 语义清晰，支持内容撑开 | 不兼容 IE 和旧版浏览器           |
| padding hack   | 兼容性极好，IE8+       | 需额外嵌套层，`height: 0` 不直观 |
| viewport 单位  | 简单直接               | 仅限视口相关宽度                 |

## padding 百分比为何相对于宽度

如果 padding 百分比相对于高度，而高度又依赖于内容（包括 padding），就会形成循环依赖，无法确定最终值。统一参照宽度可避免此问题，因为块级元素的宽度通常由包含块确定，是稳定的参照值。

## 总结

1. 现代项目首选 `aspect-ratio`，语义明确、代码简洁，支持内容自然撑开
2. 经典方案利用 padding 百分比相对宽度计算的特性，`height: 0` + `padding-top` 模拟固定比例
3. padding 百分比参照宽度而非高度，是为了避免高度与 padding 间的循环依赖
4. padding hack 需要额外一层绝对定位子元素承载内容
5. viewport 单位方案适用范围窄，仅在宽度与视口直接关联时可用
