module.exports = {
  // 基础配置
  printWidth: 100, // 行宽
  tabWidth: 2, // 缩进空格数
  useTabs: false, // 使用空格而不是制表符
  semi: true, // 语句末尾添加分号
  singleQuote: true, // 使用单引号
  quoteProps: 'as-needed', // 对象属性引号：仅在需要时添加
  jsxSingleQuote: false, // JSX 中使用双引号
  trailingComma: 'es5', // 尾随逗号：ES5 兼容
  bracketSpacing: true, // 对象字面量中的括号前后添加空格
  bracketSameLine: false, // JSX 标签的 `>` 放在最后一行的末尾
  arrowParens: 'avoid', // 箭头函数参数：尽可能省略括号
  endOfLine: 'lf', // 换行符：LF (Unix)

  // 文件类型特定配置
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue', // 使用 Vue 解析器
      },
    },
    {
      files: '*.{ts,tsx,js,jsx}',
      options: {
        parser: 'typescript', // 使用 TypeScript 解析器
      },
    },
    {
      files: '*.{json,yml,yaml}',
      options: {
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always', // Markdown 文本换行
        printWidth: 80, // Markdown 使用较短行宽
      },
    },
  ],
};
