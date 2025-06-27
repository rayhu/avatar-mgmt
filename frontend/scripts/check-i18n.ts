#!/usr/bin/env node

/**
 * 检查国际化翻译完整性
 * 运行: yarn i18n:check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 翻译文件路径
const zhCNPath = path.join(__dirname, '../src/locales/zh-CN.ts');
const enPath = path.join(__dirname, '../src/locales/en.ts');

// 加载翻译文件并解析为对象
function loadTranslations(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 移除 export default 和最后的 ;
  const cleanContent = content
    .replace(/export\s+default\s*/, '')
    .replace(/;?\s*$/, '');
  
  try {
    // 使用 eval 来解析对象（在生产环境中应该使用更安全的方法）
    return eval(`(${cleanContent})`);
  } catch (error) {
    console.error('Failed to parse translation file:', error);
    return {};
  }
}

// 递归获取对象的所有键路径
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    // 使用 Object.prototype.hasOwnProperty.call 来安全地检查属性
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

// 从代码中提取所有使用的翻译键
function extractUsedKeys(dir: string): string[] {
  const usedKeys: string[] = [];
  const vueFiles = findFiles(dir, ['.vue']);
  const tsFiles = findFiles(dir, ['.ts']);
  const jsFiles = findFiles(dir, ['.js']);
  
  const allFiles = [...vueFiles, ...tsFiles, ...jsFiles];
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    
    // 匹配 t('key') 或 t("key") 模式，但排除模板字符串和变量
    const tFunctionRegex = /t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    
    while ((match = tFunctionRegex.exec(content)) !== null) {
      const key = match[1];
      
      // 过滤掉明显不是翻译键的内容
      if (isValidTranslationKey(key)) {
        usedKeys.push(key);
      }
    }
  }
  
  return [...new Set(usedKeys)]; // 去重
}

// 检查是否是有效的翻译键
function isValidTranslationKey(key: string): boolean {
  // 排除包含模板变量的键
  if (key.includes('${') || key.includes('$')) {
    return false;
  }
  
  // 排除明显不是翻译键的内容
  const invalidPatterns = [
    /^[a-z]+$/i, // 单个单词
    /^[a-z]+\.[a-z]+$/i, // 简单路径
    /^[a-z]+-[a-z]+$/i, // 带连字符的单词
    /^[a-z]+_[a-z]+$/i, // 带下划线的单词
    /^[a-z]+\([a-z]+\)$/i, // 函数调用
    /^[a-z]+\.[a-z]+\([a-z]+\)$/i, // 对象方法调用
    /^[a-z]+:[a-z]+$/i, // 冒号分隔
    /^[a-z]+\/[a-z]+$/i, // 路径分隔
    /^[a-z]+\\[a-z]+$/i, // 反斜杠分隔
    /^[a-z]+@[a-z]+$/i, // 邮箱格式
    /^[a-z]+#[a-z]+$/i, // 哈希格式
    /^[a-z]+\.[a-z]+\.[a-z]+$/i, // 三层路径
  ];
  
  // 检查是否匹配无效模式
  for (const pattern of invalidPatterns) {
    if (pattern.test(key)) {
      return false;
    }
  }
  
  // 检查是否包含中文或特殊字符（可能是误判）
  if (/[\u4e00-\u9fff]/.test(key) || /[^\w.]/.test(key)) {
    return false;
  }
  
  return true;
}

// 查找文件
function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 检查翻译完整性
function checkTranslations() {
  console.log('🔍 检查国际化翻译完整性...\n');
  
  // 加载翻译文件
  const zhCNTranslations = loadTranslations(zhCNPath);
  const enTranslations = loadTranslations(enPath);
  
  // 获取所有翻译键
  const zhCNKeys = getAllKeys(zhCNTranslations);
  const enKeys = getAllKeys(enTranslations);
  
  // 从代码中提取使用的键
  const srcDir = path.join(__dirname, '../src');
  const usedKeys = extractUsedKeys(srcDir);
  
  console.log(`📊 统计信息:`);
  console.log(`   中文翻译键: ${zhCNKeys.length}`);
  console.log(`   英文翻译键: ${enKeys.length}`);
  console.log(`   代码中使用的键: ${usedKeys.length}\n`);
  
  // 检查缺失的翻译
  const missingInZhCN = usedKeys.filter(key => !zhCNKeys.includes(key));
  const missingInEn = usedKeys.filter(key => !enKeys.includes(key));
  
  let hasIssues = false;
  
  if (missingInZhCN.length > 0) {
    hasIssues = true;
    console.log('❌ 中文翻译缺失:');
    missingInZhCN.forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log('');
  }
  
  if (missingInEn.length > 0) {
    hasIssues = true;
    console.log('❌ 英文翻译缺失:');
    missingInEn.forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log('');
  }
  
  // 检查未使用的翻译键（只显示明显的未使用键）
  const unusedZhCN = zhCNKeys.filter(key => !usedKeys.includes(key) && key.includes('.'));
  const unusedEn = enKeys.filter(key => !usedKeys.includes(key) && key.includes('.'));
  
  if (unusedZhCN.length > 0) {
    console.log('⚠️  可能未使用的中文翻译键:');
    unusedZhCN.slice(0, 10).forEach(key => { // 只显示前10个
      console.log(`   - ${key}`);
    });
    if (unusedZhCN.length > 10) {
      console.log(`   ... 还有 ${unusedZhCN.length - 10} 个`);
    }
    console.log('');
  }
  
  if (unusedEn.length > 0) {
    console.log('⚠️  可能未使用的英文翻译键:');
    unusedEn.slice(0, 10).forEach(key => { // 只显示前10个
      console.log(`   - ${key}`);
    });
    if (unusedEn.length > 10) {
      console.log(`   ... 还有 ${unusedEn.length - 10} 个`);
    }
    console.log('');
  }
  
  if (!hasIssues) {
    console.log('✅ 所有翻译键都已完整！');
    process.exit(0);
  } else {
    console.log('❌ 发现翻译缺失，请补充后重新提交！');
    process.exit(1); // 非零退出码，阻止提交
  }
}

// 主函数
function main() {
  try {
    checkTranslations();
  } catch (error) {
    console.error('❌ 检查翻译时发生错误:', error);
    process.exit(1);
  }
}

main(); 
