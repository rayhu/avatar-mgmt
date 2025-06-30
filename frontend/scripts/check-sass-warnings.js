#!/usr/bin/env node

/**
 * Script to check for Sass deprecation warnings in the codebase
 * Run with: node scripts/check-sass-warnings.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

// Patterns to check for deprecated Sass features
const deprecatedPatterns = [
  {
    name: '@import statements',
    pattern: /@import\s+['"][^'"]*\.scss['"]/g,
    suggestion: 'Replace with @use'
  },
  {
    name: 'darken() function',
    pattern: /darken\(/g,
    suggestion: 'Replace with color.adjust($color, $lightness: -X%)'
  },
  {
    name: 'lighten() function',
    pattern: /lighten\(/g,
    suggestion: 'Replace with color.adjust($color, $lightness: X%)'
  },
  {
    name: 'saturate() function',
    pattern: /saturate\(/g,
    suggestion: 'Replace with color.adjust($color, $saturation: X%)'
  },
  {
    name: 'desaturate() function',
    pattern: /desaturate\(/g,
    suggestion: 'Replace with color.adjust($color, $saturation: -X%)'
  }
];

// Check for missing color module imports
function checkMissingColorImport(content, filePath) {
  const hasColorAdjust = /color\.adjust\(/g.test(content);
  const hasColorImport = /@use\s+['"]sass:color['"]/g.test(content);
  
  if (hasColorAdjust && !hasColorImport) {
    return {
      pattern: 'Missing sass:color import',
      matches: 1,
      suggestion: 'Add @use "sass:color"; at the top of the file'
    };
  }
  
  return null;
}

function findFiles(dir, extensions = ['.vue', '.scss']) {
  const files = [];
  
  function traverse(currentDir) {
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

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for deprecated patterns
  for (const pattern of deprecatedPatterns) {
    const matches = content.match(pattern.pattern);
    if (matches) {
      issues.push({
        pattern: pattern.name,
        matches: matches.length,
        suggestion: pattern.suggestion
      });
    }
  }
  
  // Check for missing color import
  const colorImportIssue = checkMissingColorImport(content, filePath);
  if (colorImportIssue) {
    issues.push(colorImportIssue);
  }
  
  return issues;
}

function main() {
  console.log('🔍 Checking for Sass deprecation warnings...\n');
  
  const files = findFiles(srcDir);
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  for (const file of files) {
    const issues = checkFile(file);
    
    if (issues.length > 0) {
      filesWithIssues++;
      const relativePath = path.relative(process.cwd(), file);
      console.log(`📁 ${relativePath}`);
      
      for (const issue of issues) {
        console.log(`   ⚠️  ${issue.pattern}: ${issue.matches} occurrence(s)`);
        console.log(`      💡 ${issue.suggestion}`);
        totalIssues += issue.matches;
      }
      console.log('');
    }
  }
  
  if (filesWithIssues === 0) {
    console.log('✅ No Sass deprecation warnings found!');
  } else {
    console.log(`📊 Summary:`);
    console.log(`   Files with issues: ${filesWithIssues}`);
    console.log(`   Total issues: ${totalIssues}`);
    console.log('\n💡 To fix these warnings:');
    console.log('   1. Replace @import with @use');
    console.log('   2. Replace color functions with color.adjust()');
    console.log('   3. Add @use "sass:color"; when using color.adjust()');
    console.log('   4. Run this script again to verify fixes');
  }
}

main(); 
