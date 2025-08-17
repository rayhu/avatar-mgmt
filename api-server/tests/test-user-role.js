#!/usr/bin/env node

/**
 * 测试脚本：检查 Directus 中的用户角色信息
 * 使用方法：node test-user-role.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@example.com';
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'your-password';

async function testUserRole() {
  console.log('🔍 开始测试用户角色信息...\n');
  
  if (!DIRECTUS_URL) {
    console.error('❌ DIRECTUS_URL 未配置');
    return;
  }
  
  try {
    // 1. 尝试登录
    console.log('📝 步骤 1: 尝试登录...');
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD
    });
    
    const { access_token } = loginResponse.data.data;
    console.log('✅ 登录成功，获取到 access_token\n');
    
    // 2. 获取用户信息
    console.log('📝 步骤 2: 获取用户信息...');
    const userResponse = await axios.get(`${DIRECTUS_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    const userData = userResponse.data.data;
    console.log('✅ 获取用户信息成功\n');
    
    // 3. 显示用户角色信息
    console.log('🔍 用户角色信息:');
    console.log('  - 用户 ID:', userData.id);
    console.log('  - 邮箱:', userData.email);
    console.log('  - 姓名:', `${userData.first_name || ''} ${userData.last_name || ''}`.trim());
    console.log('  - 角色类型:', typeof userData.role);
    console.log('  - 角色值:', JSON.stringify(userData.role, null, 2));
    
    if (userData.role && typeof userData.role === 'object') {
      console.log('  - 角色名称:', userData.role.name);
      console.log('  - 角色 ID:', userData.role.id);
    }
    
    // 4. 检查是否为管理员
    const adminRoleNames = [
      'admin', 'Administrator', 'Admin', 'ADMIN', 'administrator',
      'super_admin', 'superadmin', 'Super Admin', 'SuperAdmin'
    ];
    
    let userRole = 'user';
    if (userData.role) {
      if (typeof userData.role === 'object' && userData.role.name) {
        userRole = userData.role.name;
      } else if (typeof userData.role === 'string') {
        userRole = userData.role;
      }
    }
    
    const isAdmin = adminRoleNames.includes(userRole);
    
    console.log('\n🔍 权限分析:');
    console.log('  - 处理后的角色名称:', userRole);
    console.log('  - 是否为管理员:', isAdmin ? '✅ 是' : '❌ 否');
    console.log('  - 支持的管理员角色:', adminRoleNames.join(', '));
    
    if (!isAdmin) {
      console.log('\n⚠️  建议:');
      console.log('  1. 在 Directus 中检查用户角色设置');
      console.log('  2. 确保角色名称在支持列表中');
      console.log('  3. 或者修改代码支持当前的角色名称');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('  - 状态码:', error.response.status);
      console.error('  - 响应数据:', error.response.data);
    }
  }
}

// 运行测试
testUserRole();
