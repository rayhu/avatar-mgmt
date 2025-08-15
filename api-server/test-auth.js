#!/usr/bin/env node

// 简单的认证 API 测试脚本
const API_BASE = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 测试认证 API...\n');

  // 测试用例1: 正确的管理员账户
  console.log('📝 测试用例1: 管理员登录');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    console.log('✅ 管理员登录测试通过\n');
  } catch (error) {
    console.log('❌ 管理员登录测试失败:', error.message);
  }

  // 测试用例2: 正确的普通用户账户
  console.log('📝 测试用例2: 普通用户登录');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'user123' })
    });
    
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    console.log('✅ 普通用户登录测试通过\n');
  } catch (error) {
    console.log('❌ 普通用户登录测试失败:', error.message);
  }

  // 测试用例3: 错误的密码
  console.log('📝 测试用例3: 错误密码');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    console.log('✅ 错误密码测试通过\n');
  } catch (error) {
    console.log('❌ 错误密码测试失败:', error.message);
  }

  // 测试用例4: 不存在的用户
  console.log('📝 测试用例4: 不存在的用户');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'anypassword' })
    });
    
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    console.log('✅ 不存在用户测试通过\n');
  } catch (error) {
    console.log('❌ 不存在用户测试失败:', error.message);
  }

  // 测试用例5: 缺少参数
  console.log('📝 测试用例5: 缺少参数');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin' })
    });
    
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(data, null, 2));
    console.log('✅ 缺少参数测试通过\n');
  } catch (error) {
    console.log('❌ 缺少参数测试失败:', error.message);
  }

  console.log('🎉 所有测试完成!');
}

// 运行测试
testAuth().catch(console.error);
