/**
 * i18n 检查脚本
 * 用于检查 Vue 文件中的硬编码字符串和翻译键
 * 
 * 使用方法：
 * yarn i18n:check - 运行检查
 * yarn i18n:report - 生成报告
 * 
 * 注意：此脚本不会修改任何文件，仅进行检查和报告
 */

import { sync } from 'vue-i18n-extract'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// 定义问题类型
interface TranslationIssue {
  type: 'hardcoded' | 'missing-translation'
  file: string
  line: number
  message: string
}

// 检查配置
const config = {
  // Vue 文件路径模式
  vueFiles: './src/**/*.vue',
  // 语言文件路径模式
  languageFiles: './src/locales/*.json',
  // 输出目录
  output: './src/locales',
  // 不自动添加缺失的翻译
  add: false,
  // 不自动删除未使用的翻译
  remove: false,
  // CI 模式
  ci: true,
  // 翻译键分隔符
  separator: '.',
  // 排序翻译键
  sort: true
}

async function checkTranslations() {
  const reportDir = join(process.cwd(), 'reports')
  
  try {
    // 创建报告目录
    mkdirSync(reportDir, { recursive: true })
    
    // 运行检查
    await sync(config)
    
    console.log('✅ i18n check passed!')
    process.exit(0)
  } catch (error) {
    // 获取问题列表
    const issues: TranslationIssue[] = error.issues || []
    
    // 生成报告
    const report = {
      timestamp: new Date().toISOString(),
      issues,
      config: {
        ...config,
        // 移除敏感信息
        output: undefined
      }
    }
    
    // 保存报告
    writeFileSync(
      join(reportDir, 'i18n-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    // 输出错误信息
    console.error('❌ i18n check failed!')
    console.error('Issues found:')
    issues.forEach(issue => {
      console.error(`- ${issue.type}: ${issue.message} (${issue.file}:${issue.line})`)
    })
    
    // 输出使用说明
    console.error('\nTo fix these issues:')
    console.error('1. Replace hardcoded strings with translation keys')
    console.error('2. Add missing translations to all language files')
    console.error('3. Run the check again to verify fixes')
    
    process.exit(1)
  }
}

// 运行检查
checkTranslations() 