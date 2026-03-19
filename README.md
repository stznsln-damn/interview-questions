# Interview Questions

前端开发工程师面试题集，涵盖 HTML、CSS、JavaScript、TypeScript、Vue、React 等主流前端技术栈。

## 项目结构

```text
├── questions/          # 面试题文档
│   ├── ai-*            # AI 相关
│   ├── css-*           # CSS 相关
│   ├── javascript-*    # JavaScript 相关
│   ├── performance-*   # 性能优化相关
│   ├── react-*         # React 相关
│   ├── vue-*           # Vue 相关
│   └── webpack-*       # Webpack 相关
├── AGENTS.md           # AI Agent 配置
├── commitlint.config.js
├── .markdownlint-cli2.jsonc
├── .prettierrc
└── package.json
```

## 题目分类

| 分类        | 数量 | 说明                                                                                            |
| ----------- | ---- | ----------------------------------------------------------------------------------------------- |
| Vue         | 10   | setup中解构props丢失响应性、beforeCreate阶段无法访问data、setup中同步修改数据与onBeforeUpdate等 |
| JavaScript  | 7    | 使用WeakMap解决循环引用、滚动位置实现目录节点自动高亮、大文件分片上传与断点续传等               |
| Engineering | 5    | Vite热更新HMR原理、Webpack Tree Shaking与Vite DCE的异同、Hash模式对SEO的影响与预渲染优化等      |
| AI          | 1    | AI的使用和前沿概念                                                                              |
| CSS         | 1    | 实现固定宽高比容器                                                                              |
| Performance | 1    | 十万条数据表格组件的设计与优化                                                                  |
| React       | 1    | 实现支持撤销重做的Hook                                                                          |
| Webpack     | 1    | Loader链式调用顺序影响编译结果                                                                  |

## 使用方式

### 安装依赖

```bash
pnpm install
```

### 格式化 & 校验

```bash
# Markdown 语法检查
pnpm lint

# Markdown 语法自动修复
pnpm lint:fix

# 格式化 Markdown 文件
pnpm format

# 检查格式是否符合规范
pnpm format:check
```

### 提交规范

项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，通过 `commitlint` + `husky` 在提交时自动校验。

支持的 commit 类型：

- `feat` - 新增面试题
- `fix` - 修复内容错误
- `docs` - 文档变更
- `style` - 格式调整（不影响内容）
- `refactor` - 内容重构
- `chore` - 工具配置变更

### 文档命名规则

```text
{分类}-{序号}-{简要描述}.md
```

示例：`vue-1-setup中解构props丢失响应性.md`

- 分类序号独立计数，不同分类之间互不影响
- 描述尽量简洁，体现题目核心内容

## 工具链

- **pnpm** - 包管理器
- **markdownlint-cli2** - Markdown 语法校验
- **Prettier** - 代码格式化
- **husky** + **lint-staged** - Git hooks，提交前自动格式化
- **commitlint** - 提交信息规范校验

## License

ISC
