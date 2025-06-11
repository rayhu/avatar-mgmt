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

import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

interface TranslationIssue {
  type: 'missing' | 'unused' | 'duplicate';
  message: string;
  file: string;
  line: number;
}

interface I18nReport {
  issues: TranslationIssue[];
  summary: {
    totalIssues: number;
    missingKeys: number;
    unusedKeys: number;
    duplicateKeys: number;
  };
}

async function checkTranslations(): Promise<I18nReport> {
  const issues: TranslationIssue[] = [];
  const srcDir = resolve(__dirname, '../src');
  const localesDir = join(srcDir, 'locales');
  
  // 读取所有语言文件
  const localeFiles = readdirSync(localesDir)
    .filter(file => file.endsWith('.ts'))
    .map(file => join(localesDir, file));
  
  const translations = new Map<string, Set<string>>();
  
  // 解析所有语言文件
  for (const file of localeFiles) {
    const content = readFileSync(file, 'utf-8');
    const locale = file.split('/').pop()?.replace('.ts', '') || '';
    const keys = new Set<string>();
    
    // 简单的键提取（可以根据需要改进）
    const matches = content.match(/"([^"]+)":/g) || [];
    matches.forEach(match => {
      const key = match.slice(1, -2);
      keys.add(key);
    });
    
    translations.set(locale, keys);
  }
  
  // 检查所有 Vue 文件
  const vueFiles = await glob('src/**/*.vue', { cwd: __dirname });
  
  for (const file of vueFiles) {
    const content = readFileSync(join(__dirname, file), 'utf-8');
    
    // 检查 t() 函数调用
    const tMatches = content.match(/t\(['"]([^'"]+)['"]\)/g) || [];
    tMatches.forEach(match => {
      const key = match.slice(3, -2);
      
      // 检查键是否存在于所有语言文件中
      for (const [locale, keys] of translations) {
        if (!keys.has(key)) {
          issues.push({
            type: 'missing',
            message: `Missing translation key "${key}" in ${locale}`,
            file,
            line: content.split('\n').findIndex(line => line.includes(match)) + 1
          });
        }
      }
    });
  }
  
  // 生成报告
  const report: I18nReport = {
    issues,
    summary: {
      totalIssues: issues.length,
      missingKeys: issues.filter(i => i.type === 'missing').length,
      unusedKeys: issues.filter(i => i.type === 'unused').length,
      duplicateKeys: issues.filter(i => i.type === 'duplicate').length
    }
  };
  
  return report;
}

// 主函数
async function main() {
  try {
    const report = await checkTranslations();
    
    if (process.argv.includes('--report')) {
      // 生成报告文件
      const reportPath = join(__dirname, '../reports/i18n-report.json');
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`Report generated at: ${reportPath}`);
    } else {
      // 输出检查结果
      if (report.issues.length > 0) {
        console.error('i18n 检查发现以下问题：');
        report.issues.forEach(issue => {
          console.error(`${issue.type.toUpperCase()}: ${issue.message} (${issue.file}:${issue.line})`);
        });
        process.exit(1);
      } else {
        console.log('i18n 检查通过！');
      }
    }
  } catch (error) {
    console.error('检查过程中发生错误：', error);
    process.exit(1);
  }
}

main(); 