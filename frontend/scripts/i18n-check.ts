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

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

interface TranslationIssue {
  type: 'missing' | 'unused' | 'duplicate' | 'hardcoded' | 'format';
  message: string;
  file: string;
  line: number;
  suggestion?: string;
}

interface I18nReport {
  issues: TranslationIssue[];
  summary: {
    totalIssues: number;
    missingKeys: number;
    unusedKeys: number;
    duplicateKeys: number;
    hardcodedStrings: number;
    formatIssues: number;
  };
  timestamp: string;
  config: {
    vueFiles: string[];
    localeFiles: string[];
  };
}

async function checkTranslations(): Promise<I18nReport> {
  const issues: TranslationIssue[] = [];
  const srcDir = resolve(__dirname, '../src');
  const localesDir = join(srcDir, 'locales');

  // 读取所有语言文件
  const localeFiles = readdirSync(localesDir)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => join(localesDir, file));

  const translations = new Map<string, Set<string>>();
  const allKeys = new Set<string>();

  // 解析所有语言文件
  for (const file of localeFiles) {
    const content = readFileSync(file, 'utf-8');
    const locale = file.split('/').pop()?.replace('.ts', '') || '';
    const keys = new Set<string>();

    // 提取翻译键
    const matches = content.match(/"([^"]+)":/g) || [];
    matches.forEach((match) => {
      const key = match.slice(1, -2);
      keys.add(key);
      allKeys.add(key);
    });

    translations.set(locale, keys);
  }

  // 检查所有 Vue 文件
  const vueFiles = await glob('src/**/*.vue', { cwd: __dirname });

  for (const file of vueFiles) {
    const content = readFileSync(join(__dirname, file), 'utf-8');

    // 检查 t() 函数调用
    const tMatches = content.match(/t\(['"]([^'"]+)['"]\)/g) || [];
    tMatches.forEach((match) => {
      const key = match.slice(3, -2);

      // 检查键是否存在于所有语言文件中
      for (const [locale, keys] of translations) {
        if (!keys.has(key)) {
          issues.push({
            type: 'missing',
            message: `Missing translation key "${key}" in ${locale}`,
            file,
            line: content.split('\n').findIndex((line) => line.includes(match)) + 1,
            suggestion: `Add "${key}": "..." to ${locale}.ts`,
          });
        }
      }
    });

    // 检查硬编码的中文字符串
    const chineseMatches = content.match(/["']([\u4e00-\u9fa5]+)["']/g) || [];
    chineseMatches.forEach((match) => {
      const text = match.slice(1, -1);
      if (text.length > 1) {
        // 忽略单字符
        issues.push({
          type: 'hardcoded',
          message: `Hardcoded Chinese text: "${text}"`,
          file,
          line: content.split('\n').findIndex((line) => line.includes(match)) + 1,
          suggestion: `Replace with t('your.translation.key')`,
        });
      }
    });
  }

  // 检查未使用的翻译键
  for (const key of allKeys) {
    let isUsed = false;
    for (const file of vueFiles) {
      const content = readFileSync(join(__dirname, file), 'utf-8');
      if (content.includes(`t('${key}')`) || content.includes(`t("${key}")`)) {
        isUsed = true;
        break;
      }
    }
    if (!isUsed) {
      issues.push({
        type: 'unused',
        message: `Unused translation key: "${key}"`,
        file: 'locales/*.ts',
        line: 0,
        suggestion: `Remove this key if it's no longer needed`,
      });
    }
  }

  // 生成报告
  const report: I18nReport = {
    issues,
    summary: {
      totalIssues: issues.length,
      missingKeys: issues.filter((i) => i.type === 'missing').length,
      unusedKeys: issues.filter((i) => i.type === 'unused').length,
      duplicateKeys: issues.filter((i) => i.type === 'duplicate').length,
      hardcodedStrings: issues.filter((i) => i.type === 'hardcoded').length,
      formatIssues: issues.filter((i) => i.type === 'format').length,
    },
    timestamp: new Date().toISOString(),
    config: {
      vueFiles,
      localeFiles: localeFiles.map((f) => f.split('/').pop() || ''),
    },
  };

  return report;
}

// 主函数
async function main() {
  try {
    const report = await checkTranslations();

    if (process.argv.includes('--report')) {
      // 创建报告目录
      const reportDir = join(__dirname, '../reports');
      mkdirSync(reportDir, { recursive: true });

      // 生成报告文件
      const reportPath = join(reportDir, 'i18n-report.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`✅ Report generated at: ${reportPath}`);

      // 输出摘要
      console.log('\nSummary:');
      console.log(`Total Issues: ${report.summary.totalIssues}`);
      console.log(`Missing Keys: ${report.summary.missingKeys}`);
      console.log(`Unused Keys: ${report.summary.unusedKeys}`);
      console.log(`Hardcoded Strings: ${report.summary.hardcodedStrings}`);
    } else {
      // 输出检查结果
      if (report.issues.length > 0) {
        console.error('❌ i18n 检查发现以下问题：');
        report.issues.forEach((issue) => {
          console.error(`\n${issue.type.toUpperCase()}: ${issue.message}`);
          console.error(`File: ${issue.file}:${issue.line}`);
          if (issue.suggestion) {
            console.error(`Suggestion: ${issue.suggestion}`);
          }
        });
        process.exit(1);
      } else {
        console.log('✅ i18n 检查通过！');
      }
    }
  } catch (error) {
    console.error('❌ 检查过程中发生错误：', error);
    process.exit(1);
  }
}

main();
