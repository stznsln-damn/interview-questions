/**
 * Shiki 自定义 Transformer：向每个 <pre> 注入复制按钮
 *
 * 工作原理：
 *   Shiki transformer 的 `pre` 钩子在 HAST（HTML AST）层面操作，
 *   往 <pre> 节点的 children 里追加一个 <button> 节点。
 *   按钮的点击行为由内联 onclick 处理，不依赖额外框架。
 */
import type { ShikiTransformer } from "shiki";

export function transformerCopyButton(): ShikiTransformer {
  return {
    name: "copy-button",
    pre(node) {
      node.properties.style ??= "";
      node.properties.style += ";position:relative;";

      node.children.push({
        type: "element",
        tagName: "button",
        properties: {
          class: "copy-btn",
          "data-code": this.source,
          onclick: `
            navigator.clipboard.writeText(this.dataset.code).then(() => {
              this.classList.add('copied');
              setTimeout(() => this.classList.remove('copied'), 2000);
            })
          `.replace(/\s+/g, " "),
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { class: "copy-icon" },
            children: [{ type: "text", value: "Copy" }],
          },
          {
            type: "element",
            tagName: "span",
            properties: { class: "copied-icon" },
            children: [{ type: "text", value: "Copied!" }],
          },
        ],
      });
    },
  };
}
