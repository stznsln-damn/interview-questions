module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // type 类型定义
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档变更
        'style',    // 代码风格（不影响功能）
        'refactor', // 重构（非新增功能、非修复 bug）
        'perf',     // 性能优化
        'test',     // 添加测试
        'chore',    // 构建过程或辅助工具变动
        'revert',   // 回退
        'build',    // 打包
        'ci',       // CI 配置
      ],
    ],
    // type 不能为空
    'type-empty': [2, 'never'],
    // subject 不能为空
    'subject-empty': [2, 'never'],
    // subject 不以句号结尾
    'subject-full-stop': [0, 'never'],
    // subject 不限制大小写
    'subject-case': [0, 'never'],
  },
};
