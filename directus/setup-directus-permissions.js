const fs = require('fs');
const path = require('path');

// 动态导入 fetch，兼容不同 Node.js 版本
let fetch;
try {
  // Node.js 18+ 内置 fetch
  if (globalThis.fetch) {
    fetch = globalThis.fetch;
    console.log('✅ 使用 Node.js 内置 fetch');
  } else {
    // 回退到 node-fetch
    fetch = require('node-fetch');
    console.log('✅ 使用 node-fetch 包');
  }
} catch (error) {
  console.error('❌ 无法加载 fetch，请确保 Node.js 版本 >= 18 或已安装 node-fetch');
  process.exit(1);
}

// 读取环境变量文件的函数
function loadEnvFile(envPath) {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const env = {};
      
      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim();
          
          // 移除引号
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            env[key.trim()] = value.slice(1, -1);
          } else {
            env[key.trim()] = value;
          }
        }
      });
      
      return env;
    }
  } catch (error) {
    console.warn(`⚠️  无法读取环境变量文件 ${envPath}:`, error.message);
  }
  return {};
}

// 自动检测并加载环境变量
function loadEnvironmentVariables() {
  // 获取脚本所在目录的上级目录（repo 根目录）
  const repoRoot = path.resolve(__dirname, '..');
  
  // 尝试加载不同环境的环境变量文件，API 和 Directus 同步
  const envFiles = [
    path.join(repoRoot, '.env.prod.api'),
    path.join(repoRoot, '.env.stage.api'),
    path.join(repoRoot, '.env.api'),
    path.join(repoRoot, '.env')
  ];
  
  let env = {};
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`📁 加载环境变量文件: ${envFile}`);
      const fileEnv = loadEnvFile(envFile);
      env = { ...env, ...fileEnv };
      break; // 只加载第一个存在的文件
    }
  }
  
  // 如果API环境变量文件中没有找到必要的配置，使用默认值
  const ADMIN_EMAIL = env.DIRECTUS_ADMIN_EMAIL || process.env.DIRECTUS_ADMIN_EMAIL || 'admin@example.com';
  const ADMIN_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD || process.env.DIRECTUS_ADMIN_PASSWORD || 'your_admin_password';

  // API的访问路径是Docker网络，这里是本地网络，所以是localhost
  const DIRECTUS_URL = 'http://localhost:8055';
  
  console.log('🔧 配置信息:');
  console.log(`   Directus URL: ${DIRECTUS_URL}`);
  console.log(`   Admin Email: ${ADMIN_EMAIL}`);
  console.log(`   Admin Password: ${ADMIN_PASSWORD ? '***已配置***' : '❌ 未配置'}`);
  console.log('');
  
  return { DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD };
}

// 加载环境变量
const { DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = loadEnvironmentVariables();

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

// 5. 应用 schema 快照
async function applySchemaSnapshot() {
  console.log('🔄 正在应用 schema 快照...');
  
  try {
    // 使用 docker compose 命令应用快照
    const { execSync } = require('child_process');
    const snapshotPath = path.join(__dirname, 'schemas', 'snapshot.yml');
    
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`快照文件不存在: ${snapshotPath}`);
    }
    
    console.log(`📁 快照文件路径: ${snapshotPath}`);
    
    // 获取 repo 根目录
    const repoRoot = path.resolve(__dirname, '..');
    
    // 切换到 repo 根目录并执行 docker compose 命令
    const command = `cd "${repoRoot}" && sudo docker compose -f docker-compose.stage.yml exec -T directus npx directus schema apply --yes`;
    
    console.log('🚀 执行命令:', command);
    
    // 读取快照文件内容并通过 stdin 传递给命令
    const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
    
    const result = execSync(command, {
      input: snapshotContent,
      encoding: 'utf8',
      cwd: repoRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log('✅ Schema 快照应用成功');
    console.log('📋 输出:', result);
    
  } catch (error) {
    console.error('❌ 应用 schema 快照失败:', error.message);
    throw error;
  }
}

// 6. 导入 CSV 数据
async function importCSVData() {
  console.log('📊 正在导入 CSV 数据...');
  
  try {
    const csvPath = path.join(__dirname, 'prod_data_export', 'avatars 20250804-25717.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV 文件不存在: ${csvPath}`);
    }
    
    console.log(`📁 CSV 文件路径: ${csvPath}`);
    
    // 读取 CSV 文件内容
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // 解析 CSV 数据
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      return row;
    });
    
    console.log(`📊 解析到 ${data.length} 条记录`);
    
    // 通过 Directus API 导入数据
    const token = await login();
    
    for (const record of data) {
      try {
        // 跳过 id 字段，让数据库自动生成
        const { id, ...recordData } = record;
        
        // 处理空字符串，转换为 null
        Object.keys(recordData).forEach(key => {
          if (recordData[key] === '') {
            recordData[key] = null;
          }
        });
        
        const createRes = await fetch(`${DIRECTUS_URL}/items/avatars`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(recordData),
        });
        
        if (!createRes.ok) {
          const errorData = await createRes.json();
          console.warn(`⚠️  记录导入失败:`, recordData.name, errorData);
        } else {
          const result = await createRes.json();
          console.log(`✅ 导入成功: ${recordData.name} (ID: ${result.data.id})`);
        }
        
      } catch (error) {
        console.warn(`⚠️  记录导入失败:`, record.name, error.message);
      }
    }
    
    console.log('✅ CSV 数据导入完成');
    
  } catch (error) {
    console.error('❌ 导入 CSV 数据失败:', error.message);
    throw error;
  }
}

// 7. 显示手动上传提示
function showManualUploadInstructions() {
  console.log('\n📋 ========== 手动上传说明 ==========');
  console.log('🚀 请手动上传以下文件到 Directus:');
  console.log('');
  console.log('📁 GLB 文件 (3D 模型):');
  console.log('   - 数字人示例1: 8d54a8eb-7924-4c68-b589-a61c15d678b5');
  console.log('   - 数字人示例2: 55a6709a-fb89-4f35-97e2-1a64c28e8294');
  console.log('');
  console.log('🖼️  预览图片 (JPG):');
  console.log('   - 数字人示例1: 57d5273c-5688-4a8a-9ff6-d937e67e9c1a');
  console.log('   - 数字人示例2: 456fa203-c6bd-4f13-9dfc-5b5fde514a31');
  console.log('');
  console.log('💡 上传步骤:');
  console.log('   1. 登录 Directus 管理界面');
  console.log('   2. 进入 "文件" 集合');
  console.log('   3. 上传对应的 GLB 和 JPG 文件');
  console.log('   4. 确保文件名与 UUID 匹配');
  console.log('   5. 设置文件为 "public" 可见性');
  console.log('');
  console.log('🔗 Directus 管理界面: http://localhost:8055');
  console.log('=====================================\n');
}

// 主流程
(async () => {
  try {
    console.log('🚀 开始设置 Directus 权限和导入数据...\n');
    
    // 1. 设置权限
    const token = await login();
    const roleId = await getPublicRoleId(token);
    await setFilesReadPermission(token, roleId);
    await setAccessPolicy(token, roleId);
    console.log('✅ 权限和策略设置完成\n');
    
    // 2. 应用 schema 快照
    await applySchemaSnapshot();
    
    // 3. 导入 CSV 数据
    await importCSVData();
    
    // 4. 显示手动上传说明
    showManualUploadInstructions();
    
    console.log('🎉 所有操作完成！请按照上述说明手动上传必要的文件。');
    
  } catch (err) {
    console.error('❌ 脚本执行失败:', err.message);
    console.error('详细错误:', err);
    process.exit(1);
  }
})();
