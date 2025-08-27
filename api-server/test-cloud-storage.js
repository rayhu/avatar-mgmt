#!/usr/bin/env node

/**
 * 云存储功能测试脚本
 * 用于测试signed URL生成、文件上传等功能
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token';
const TEST_FILE_PATH = process.env.TEST_FILE_PATH || './test-file.txt';

// 创建测试文件
function createTestFile() {
  const testContent = `这是一个测试文件
创建时间: ${new Date().toISOString()}
文件大小: 1024 bytes
用于测试云存储功能`;

  fs.writeFileSync(TEST_FILE_PATH, testContent, 'utf8');
  console.log(`✅ 测试文件已创建: ${TEST_FILE_PATH}`);
}

// 测试signed URL生成
async function testSignedUrlGeneration() {
  console.log('\n🔗 测试signed URL生成...');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/cloud-storage/signed-url/test-file-id?expiresIn=3600`,
      {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      console.log('✅ signed URL生成成功');
      console.log(`   URL: ${response.data.data.signedUrl}`);
      console.log(`   过期时间: ${response.data.data.expiresAt}`);
      console.log(`   有效期: ${response.data.data.expiresIn}秒`);
    } else {
      console.log('❌ signed URL生成失败:', response.data.error);
    }
  } catch (error) {
    console.log('❌ signed URL生成测试失败:', error.response?.data?.error || error.message);
  }
}

// 测试文件上传
async function testFileUpload() {
  console.log('\n📤 测试文件上传...');

  if (!fs.existsSync(TEST_FILE_PATH)) {
    console.log('⚠️  测试文件不存在，跳过上传测试');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_FILE_PATH));
    formData.append('category', 'test');
    formData.append(
      'metadata',
      JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
      })
    );

    const response = await axios.post(`${API_BASE_URL}/api/cloud-storage/upload`, formData, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders(),
      },
    });

    if (response.data.success) {
      console.log('✅ 文件上传成功');
      console.log(`   文件ID: ${response.data.data.fileId}`);
      console.log(`   文件名: ${response.data.data.fileName}`);
      console.log(`   文件大小: ${response.data.data.size} bytes`);
      console.log(`   MIME类型: ${response.data.data.mimeType}`);

      // 保存文件ID用于后续测试
      global.testFileId = response.data.data.fileId;
    } else {
      console.log('❌ 文件上传失败:', response.data.error);
    }
  } catch (error) {
    console.log('❌ 文件上传测试失败:', error.response?.data?.error || error.message);
  }
}

// 测试文件信息获取
async function testGetFileInfo() {
  console.log('\n📋 测试文件信息获取...');

  if (!global.testFileId) {
    console.log('⚠️  没有测试文件ID，跳过信息获取测试');
    return;
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/cloud-storage/${global.testFileId}/info`,
      {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      console.log('✅ 文件信息获取成功');
      console.log(`   文件ID: ${response.data.data.fileId}`);
      console.log(`   文件名: ${response.data.data.fileName}`);
      console.log(`   文件大小: ${response.data.data.fileSize} bytes`);
      console.log(`   MIME类型: ${response.data.data.mimeType}`);
      console.log(`   上传时间: ${response.data.data.uploadTime}`);
    } else {
      console.log('❌ 文件信息获取失败:', response.data.error);
    }
  } catch (error) {
    console.log('❌ 文件信息获取测试失败:', error.response?.data?.error || error.message);
  }
}

// 测试文件删除
async function testFileDeletion() {
  console.log('\n🗑️  测试文件删除...');

  if (!global.testFileId) {
    console.log('⚠️  没有测试文件ID，跳过删除测试');
    return;
  }

  try {
    const response = await axios.delete(`${API_BASE_URL}/api/cloud-storage/${global.testFileId}`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      console.log('✅ 文件删除成功');
      console.log(`   消息: ${response.data.message}`);
    } else {
      console.log('❌ 文件删除失败:', response.data.error);
    }
  } catch (error) {
    console.log('❌ 文件删除测试失败:', error.response?.data?.error || error.message);
  }
}

// 测试权限验证
async function testPermissionValidation() {
  console.log('\n🔐 测试权限验证...');

  try {
    // 测试无效token
    const response = await axios.get(`${API_BASE_URL}/api/cloud-storage/signed-url/test-file-id`, {
      headers: {
        Authorization: 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      console.log('✅ 权限验证正常 - 无效token被拒绝');
    } else {
      console.log('⚠️  权限验证可能有问题');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 权限验证正常 - 无效token被拒绝');
    } else {
      console.log('❌ 权限验证测试失败:', error.message);
    }
  }
}

// 测试错误处理
async function testErrorHandling() {
  console.log('\n⚠️  测试错误处理...');

  try {
    // 测试缺少文件ID
    const response = await axios.get(`${API_BASE_URL}/api/cloud-storage/signed-url/`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      console.log('✅ 错误处理正常 - 缺少文件ID返回404');
    } else {
      console.log('⚠️  错误处理可能有问题');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ 错误处理正常 - 缺少文件ID返回404');
    } else {
      console.log('❌ 错误处理测试失败:', error.message);
    }
  }
}

// 清理测试文件
function cleanup() {
  if (fs.existsSync(TEST_FILE_PATH)) {
    fs.unlinkSync(TEST_FILE_PATH);
    console.log(`✅ 测试文件已清理: ${TEST_FILE_PATH}`);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始云存储功能测试...');
  console.log(`📍 API地址: ${API_BASE_URL}`);
  console.log(`🔑 测试Token: ${TEST_TOKEN ? '已配置' : '未配置'}`);

  try {
    // 创建测试文件
    createTestFile();

    // 运行测试
    await testSignedUrlGeneration();
    await testFileUpload();
    await testGetFileInfo();
    await testFileDeletion();
    await testPermissionValidation();
    await testErrorHandling();

    console.log('\n🎉 所有测试完成！');
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
  } finally {
    // 清理
    cleanup();
  }
}

// 检查环境变量
function checkEnvironment() {
  console.log('\n🔍 环境检查:');

  const requiredEnvVars = [
    'CLOUD_STORAGE_PROVIDER',
    'CLOUD_STORAGE_REGION',
    'CLOUD_STORAGE_BUCKET',
    'CLOUD_STORAGE_ACCESS_KEY_ID',
    'CLOUD_STORAGE_ACCESS_KEY_SECRET',
  ];

  let allConfigured = true;

  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(
        `   ✅ ${envVar}: ${envVar.includes('SECRET') ? '***' + value.slice(-4) : value}`
      );
    } else {
      console.log(`   ❌ ${envVar}: 未配置`);
      allConfigured = false;
    }
  });

  if (!allConfigured) {
    console.log('\n⚠️  警告: 部分必需的环境变量未配置，某些测试可能失败');
    console.log('   请检查 .env.cloud-storage 文件');
  }

  return allConfigured;
}

// 运行测试
if (require.main === module) {
  // 检查环境
  const envOk = checkEnvironment();

  if (envOk) {
    runTests();
  } else {
    console.log('\n❌ 环境配置不完整，请先配置云存储环境变量');
    console.log('   参考 env.cloud-storage.example 文件');
    process.exit(1);
  }
}

module.exports = {
  runTests,
  testSignedUrlGeneration,
  testFileUpload,
  testGetFileInfo,
  testFileDeletion,
  testPermissionValidation,
  testErrorHandling,
};
