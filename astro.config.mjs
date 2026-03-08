import { defineConfig } from "astro/config";
import rehypeShiki from "@shikijs/rehype";
import {
  transformerNotationHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationErrorLevel,
} from "@shikijs/transformers";
import { transformerCopyButton } from "./src/shiki/transformerCopyButton.ts";

export default defineConfig({
  // 部署后替换为实际域名，如 https://xxx.vercel.app
  // site: "https://your-domain.vercel.app",
  markdown: {
    // 禁用 Astro 内置的 Shiki 高亮，改由 @shikijs/rehype 插件接管
    syntaxHighlight: false,
    rehypePlugins: [
      [
        rehypeShiki,
        {
          // 双主题：亮色 / 暗色，通过 CSS 变量自动切换
          themes: {
            light: "vitesse-light",
            dark: "vitesse-dark",
          },
          // Shiki 原生选项：在 <code> 上添加 language-xxx class
          addLanguageClass: true,
          // 启用实用 transformers
          transformers: [
            transformerNotationHighlight(), // // [!code highlight]
            transformerNotationDiff(), // // [!code ++]  // [!code --]
            transformerNotationFocus(), // // [!code focus]
            transformerNotationErrorLevel(), // // [!code error] // [!code warning]
            transformerCopyButton(), // 一键复制按钮（自定义 transformer）
          ],
          // 代码行换行
          wrap: true,
        },
      ],
    ],
  },
});
