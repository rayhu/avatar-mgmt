const fetch = require('node-fetch');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'your_admin_password';

// 1. 登录 Directus，获取 token
async function login() {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json();
  if (!data.data || !data.data.access_token) throw new Error('Login failed');
  return data.data.access_token;
}

// 2. 获取 Public 角色 ID
async function getPublicRoleId(token) {
  const res = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=public`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.data || !data.data.length) throw new Error('Public role not found');
  return data.data[0].id;
}

// 3. 给 Public 角色 directus_files 添加 Read 权限
async function setFilesReadPermission(token, roleId) {
  // 检查是否已有权限
  const res = await fetch(`${DIRECTUS_URL}/permissions?filter[role][_eq]=${roleId}&filter[collection][_eq]=directus_files`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const existing = data.data.find(p => p.action === 'read');
  if (existing) {
    console.log('Read permission for directus_files already exists.');
    return;
  }
  // 创建权限
  const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      role: roleId,
      collection: 'directus_files',
      action: 'read',
      permissions: {}, // 空对象表示无条件
      fields: '*',
    }),
  });
  if (!createRes.ok) throw new Error('Failed to create read permission');
  console.log('Read permission for directus_files created.');
}

// 4. 创建 Access Policy（可选，Directus 11+）
async function setAccessPolicy(token, roleId) {
  // 检查是否已有 policy
  const res = await fetch(`${DIRECTUS_URL}/access_policies?filter[role][_eq]=${roleId}&filter[collection][_eq]=directus_files`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.data && data.data.length) {
    console.log('Access policy for directus_files already exists.');
    return;
  }
  // 创建 policy，允许 visibility=public 的文件
  const createRes = await fetch(`${DIRECTUS_URL}/access_policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      role: roleId,
      collection: 'directus_files',
      action: 'read',
      permissions: { visibility: { _eq: 'public' } },
      fields: '*',
      enabled: true,
      name: 'Public can read public files',
    }),
  });
  if (!createRes.ok) throw new Error('Failed to create access policy');
  console.log('Access policy for directus_files created.');
}

// 主流程
(async () => {
  try {
    const token = await login();
    const roleId = await getPublicRoleId(token);
    await setFilesReadPermission(token, roleId);
    await setAccessPolicy(token, roleId);
    console.log('✅ 权限和策略设置完成');
  } catch (err) {
    console.error('❌ 脚本执行失败:', err.message);
    process.exit(1);
  }
})();
