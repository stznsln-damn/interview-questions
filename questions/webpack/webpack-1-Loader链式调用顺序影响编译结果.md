---
title: "Webpack 中的 Loader，链式调用顺序会影响编译结果吗？"
category: "webpack"
order: 1
---

# Webpack 中的 Loader，链式调用顺序会影响编译结果吗？

## 结论：会，而且顺序至关重要

Loader 的链式调用从右到左（从后到前）执行，每个 Loader 接收上一个的输出作为输入。顺序不同，输入不同，结果自然不同，甚至会直接报错。

## Loader 的执行模型

Loader 本质是转换函数，多个 Loader 的调用类似函数组合：

```js
// 配置: use: ['style-loader', 'css-loader', 'sass-loader']
// 实际执行:
output = styleLoader(cssLoader(sassLoader(source)));
```

## 经典示例：处理 SCSS 文件

```js
module: {
  rules: [
    {
      test: /\.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"],
      //         ③              ②             ①
    },
  ];
}
```

执行流程：

```text
.scss 源文件
    ↓  ① sass-loader：SCSS → 标准 CSS
    ↓  ② css-loader：解析 @import/url() 等依赖，转为 JS 模块
    ↓  ③ style-loader：将 CSS 通过 <style> 标签注入 DOM
最终 JS 代码
```

顺序颠倒会导致编译直接报错，因为每个 Loader 对输入格式有明确预期。

## 为什么设计成从右到左

1. **函数组合惯例**：与 compose(f, g, h)(x) === f(g(h(x))) 方向一致
2. **距离源文件最近的 Loader 放最右边**，越靠近原始格式的处理器越先执行

## Loader 的两个阶段：pitch 和 normal

```text
           ③ ← ② ← ①   normal（从右到左）
style-loader → css-loader → sass-loader
           ① → ② → ③   pitch（从左到右）
```

- **pitch 阶段**：从左到右执行 pitch 方法，若有返回值则跳过后续 Loader（熔断机制）
- **normal 阶段**：从右到左执行主函数

## 优先级排序

通过 enforce 可强制调整：pre → normal（默认）→ inline → post

## 总结

1. **Loader 链式调用从右到左执行**，每个 Loader 的输出是下一个的输入，顺序直接影响编译结果
2. **顺序错误会导致编译失败或产出异常**，因为每个 Loader 对输入格式有明确预期
3. **设计遵循函数 compose 惯例**，距离源文件格式最近的 Loader 放在最右侧
4. **完整执行分 pitch（左→右）和 normal（右→左）两阶段**，pitch 可实现熔断跳过后续 Loader
