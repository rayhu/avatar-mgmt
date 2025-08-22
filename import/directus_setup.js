const fs = require("fs");
const path = require("path");

// 动态导入 fetch，兼容不同 Node.js 版本
let fetch;
try {
  // Node.js 18+ 内置 fetch
  if (globalThis.fetch) {
    fetch = globalThis.fetch;
    console.log("✅ 使用 Node.js 内置 fetch");
  } else {
    // 回退到 node-fetch
    fetch = require("node-fetch");
    console.log("✅ 使用 node-fetch 包");
  }
} catch (error) {
  console.error(
    "❌ 无法加载 fetch，请确保 Node.js 版本 >= 18 或已安装 node-fetch"
  );
  process.exit(1);
}

// 读取环境变量文件的函数
function loadEnvFile(envPath) {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const env = {};

      content.split("\n").forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith("#") && line.includes("=")) {
          const [key, ...valueParts] = line.split("=");
          const value = valueParts.join("=").trim();

          // 移除引号
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
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
  // 尝试加载父目录下的 .env.directus 文件
  const envFile = path.join(__dirname, "..", ".env.directus");

  let env = {};

  if (fs.existsSync(envFile)) {
    console.log(`📁 加载环境变量文件: ${envFile}`);
    env = loadEnvFile(envFile);
  } else {
    console.log(`⚠️  环境变量文件不存在: ${envFile}`);
  }

  // 从 .env.directus 文件或环境变量中获取配置
  const ADMIN_EMAIL =
    env.ADMIN_EMAIL ||
    env.DIRECTUS_ADMIN_EMAIL ||
    process.env.DIRECTUS_ADMIN_EMAIL ||
    "admin@example.com";

  const ADMIN_PASSWORD =
    env.ADMIN_PASSWORD ||
    env.DIRECTUS_ADMIN_PASSWORD ||
    process.env.DIRECTUS_ADMIN_PASSWORD ||
    "";

  // 总是连接到 localhost:8055
  const DIRECTUS_URL = "http://localhost:8055";

  console.log("🔧 配置信息:");
  console.log(`   Directus URL: ${DIRECTUS_URL}`);
  console.log(`   Admin Email: ${ADMIN_EMAIL}`);
  console.log(
    `   Admin Password: ${ADMIN_PASSWORD ? "***已配置***" : "❌ 未配置"}`
  );
  console.log("");

  if (!ADMIN_PASSWORD) {
    throw new Error(
      "DIRECTUS_ADMIN_PASSWORD 未配置，请在 .env.directus 文件中设置"
    );
  }

  return { DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD };
}

// 加载环境变量
const { DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD } =
  loadEnvironmentVariables();

// 1. 登录 Directus，获取 token
async function login() {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json();
  if (!data.data || !data.data.access_token) throw new Error("Login failed");
  return data.data.access_token;
}

// 2. 获取或创建 Public 角色 ID
async function getPublicRoleId(token) {
  // 先尝试获取 Public 角色
  const res = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Public`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log("🔍 获取 Public 角色 ID:", data);

  if (data.data && data.data.length) {
    return data.data[0].id;
  }

  // 如果不存在，创建 Public 角色
  console.log("📝 Public 角色不存在，正在创建...");
  const createRes = await fetch(`${DIRECTUS_URL}/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Public",
      description: "Public access role for unauthenticated users",
    }),
  });

  if (!createRes.ok) {
    throw new Error("Failed to create Public role");
  }

  const createData = await createRes.json();
  console.log("✅ Public 角色已创建:", createData.data.id);
  return createData.data.id;
}

// 3. 创建或获取 Public 策略，然后设置权限
async function setFilesReadPermission(token, roleId) {
  // 先获取或创建 Public 策略
  let policyId = await getOrCreatePublicPolicy(token);

  // 检查是否已有权限
  const res = await fetch(
    `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=directus_files&filter[action][_eq]=read`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json();

  if (data.data && data.data.length > 0) {
    console.log("✅ directus_files read 权限已存在");
    return;
  }

  // 创建权限
  console.log("📝 正在创建 directus_files read 权限...");
  const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      policy: policyId,
      collection: "directus_files",
      action: "read",
      permissions: {}, // 空对象表示无条件
      fields: "*",
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    console.error("❌ 权限创建失败:", errorData);
    throw new Error("Failed to create read permission");
  }

  console.log("✅ directus_files read 权限已创建");
}

// 获取或创建 Public 策略
async function getOrCreatePublicPolicy(token) {
  // 检查是否已有 Public 策略
  const res = await fetch(
    `${DIRECTUS_URL}/policies?filter[name][_eq]=$t:public_label`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json();

  if (data.data && data.data.length > 0) {
    console.log("✅ 使用已存在的 Public 策略:", data.data[0].id);
    return data.data[0].id;
  }

  // 创建 Public 策略
  console.log("📝 正在创建 Public 策略...");
  const createRes = await fetch(`${DIRECTUS_URL}/policies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Public Access Policy",
      icon: "public",
      description: "Policy for public access to files",
      admin_access: false,
      app_access: false,
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    console.error("❌ Public 策略创建失败:", errorData);
    throw new Error("Failed to create public policy");
  }

  const createData = await createRes.json();
  console.log("✅ Public 策略已创建:", createData.data.id);
  return createData.data.id;
}

// 5. 自动应用 schema 快照
async function applySchemaSnapshot() {
  console.log("🔄 正在自动应用 schema 快照...");

  try {
    // 源文件路径（当前目录，因为脚本现在在 import 目录中）
    const sourceSnapshotPath = path.join(__dirname, "snapshot.yml");
    
    // 目标文件路径（父目录的 directus/schemas 目录）
    const targetSchemasDir = path.join(__dirname, "..", "directus", "schemas");
    const targetSnapshotPath = path.join(targetSchemasDir, "snapshot.yml");

    // 检查源文件是否存在
    if (!fs.existsSync(sourceSnapshotPath)) {
      throw new Error(`快照文件不存在: ${sourceSnapshotPath}`);
    }

    console.log(`📁 源快照文件路径: ${sourceSnapshotPath}`);
    console.log(`📁 目标快照文件路径: ${targetSnapshotPath}`);

    // 确保目标目录存在
    if (!fs.existsSync(targetSchemasDir)) {
      console.log("📁 创建 directus/schemas 目录...");
      fs.mkdirSync(targetSchemasDir, { recursive: true });
    }

    // 复制快照文件
    console.log("📋 正在复制快照文件到 directus/schemas 目录...");
    fs.copyFileSync(sourceSnapshotPath, targetSnapshotPath);
    console.log("✅ 快照文件复制完成");

    // 使用 docker compose 命令自动应用快照
    const { execSync } = require("child_process");
    
    // 获取项目根目录（父目录）
    const currentDir = path.join(__dirname, "..");
    
    // 构建 docker compose 命令
    const command = `cd "${currentDir}" && sudo docker compose -f docker-compose.db.yml exec -T directus npx directus schema apply /directus/schemas/snapshot.yml --yes`;
    
    console.log("🚀 正在执行 schema 应用命令...");
    console.log(`   命令: ${command}`);
    
    const result = execSync(command, {
      encoding: "utf8",
      cwd: currentDir,
      stdio: ["inherit", "pipe", "pipe"],
    });

    console.log("✅ Schema 快照应用成功");
    if (result) {
      console.log("📋 输出:", result);
    }
  } catch (error) {
    console.error("❌ 自动应用 schema 快照失败:", error.message);
    console.log("⚠️  跳过 schema 应用，继续执行其他步骤...");
    // 不抛出错误，继续执行后续步骤
  }
}

// 确保 avatars 集合权限
async function ensureAvatarsPermissions(token) {
  try {
    // 获取公共策略 ID
    const publicPolicyRes = await fetch(
      `${DIRECTUS_URL}/policies?filter[name][_eq]=$t:public_label`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const publicPolicyData = await publicPolicyRes.json();

    if (!publicPolicyData.data || !publicPolicyData.data.length) {
      console.log("⚠️  找不到公共策略，跳过 avatars 权限设置");
      return;
    }

    const publicPolicyId = publicPolicyData.data[0].id;

    // 检查 avatars 集合的 create 权限
    const permRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[policy][_eq]=${publicPolicyId}&filter[collection][_eq]=avatars&filter[action][_eq]=create`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const permData = await permRes.json();

    if (permData.data && permData.data.length > 0) {
      console.log("✅ avatars create 权限已存在");
      return;
    }

    // 创建 avatars create 权限
    console.log("📝 正在创建 avatars create 权限...");
    const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        policy: publicPolicyId,
        collection: "avatars",
        action: "create",
        permissions: {},
        fields: "*",
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json();
      console.warn("⚠️  avatars create 权限创建失败:", errorData);
    } else {
      console.log("✅ avatars create 权限已创建");
    }
  } catch (error) {
    console.warn("⚠️  avatars 权限设置失败:", error.message);
  }
}

// 6. 创建用户
async function createUsers(token) {
  console.log("\n👥 ========== 创建用户 ==========");
  
  try {
    // 获取默认角色ID（Administrator）
    const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rolesData = await rolesRes.json();
    
    let adminRoleId = null;
    let userRoleId = null;
    
    // 查找管理员角色和普通用户角色
    if (rolesData.data) {
      for (const role of rolesData.data) {
        if (role.name === "Administrator") {
          adminRoleId = role.id;
        }
      }
    }
    
    console.log(`📋 找到管理员角色ID: ${adminRoleId}`);
    
    // 用户配置
    const usersToCreate = [
      {
        email: "admin@example.com",
        password: "admin123",
        first_name: "Admin",
        last_name: "User",
        role: adminRoleId,
        status: "active",
        description: "管理员用户"
      },
      {
        email: "user@example.com", 
        password: "user123",
        first_name: "Test",
        last_name: "User",
        role: adminRoleId, // 暂时也使用管理员角色，可以后续调整
        status: "active",
        description: "测试用户"
      }
    ];
    
    for (const userData of usersToCreate) {
      // 检查用户是否已存在
      const existingUserRes = await fetch(
        `${DIRECTUS_URL}/users?filter[email][_eq]=${userData.email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const existingUserData = await existingUserRes.json();
      
      if (existingUserData.data && existingUserData.data.length > 0) {
        console.log(`✅ 用户已存在，跳过: ${userData.email}`);
        continue;
      }
      
      console.log(`👤 正在创建用户: ${userData.email}`);
      
      // 创建用户
      const createUserRes = await fetch(`${DIRECTUS_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      
      if (createUserRes.ok) {
        const result = await createUserRes.json();
        console.log(`✅ 用户创建成功: ${userData.email} (ID: ${result.data.id})`);
        console.log(`   姓名: ${userData.first_name} ${userData.last_name}`);
        console.log(`   角色: ${userData.role ? "管理员" : "普通用户"}`);
        console.log(`   状态: ${userData.status}`);
      } else {
        const errorData = await createUserRes.json();
        console.warn(`❌ 用户创建失败: ${userData.email}`, errorData);
      }
    }
    
    console.log("✅ 用户创建完成");
    
  } catch (error) {
    console.error("❌ 创建用户失败:", error.message);
    console.log("⚠️  跳过用户创建，继续执行其他步骤...");
  }
  
  console.log("=====================================\n");
}

// 7. 自动上传文件并创建 Avatar 记录
async function autoUploadFilesAndCreateAvatars() {
  console.log("\n📋 ========== 自动上传文件并创建 Avatars ==========");
  
  try {
    // 重新获取 token
    const token = await login();
    
    // 读取 CSV 文件（当前目录）
    const csvPath = path.join(__dirname, "avatars 20250804-25717.csv");
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV 文件不存在: ${csvPath}`);
    }
    
    console.log(`📁 读取 CSV 文件: ${csvPath}`);
    
    // 解析 CSV 数据
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const lines = csvContent.split("\n").filter((line) => line.trim());
    
    // 手动解析 CSV，因为数据中可能包含逗号
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ""));
    console.log("📊 CSV Headers:", headers);
    
    const avatarConfigs = lines.slice(1).map((line) => {
      const values = parseCSVLine(line).map(v => v.replace(/"/g, ""));
      console.log("📋 Raw values:", values);
      
      // 现在 CSV 数据有正确的9列：id,name,purpose,style,description,tags,glb_file,preview,status
      const row = {
        id: values[0],
        name: values[1], 
        purpose: values[2],
        style: values[3],
        description: values[4],
        tags: values[5] ? [values[5]] : [values[1] || "默认"], // 使用tags列，如果为空则用名称作为标签
        glb_file: values[6],
        preview: values[7], 
        status: values[8]
      };
      
      console.log("📋 Mapped row:", row);
      return row;
    });
    
    console.log(`📊 解析到 ${avatarConfigs.length} 个 Avatar 配置`);
    
    console.log("🚀 开始自动上传文件并创建 Avatars...");
    
    const uploadedFiles = {};
    
    // 第一步：上传所有文件
    console.log("\n📤 第一步：上传文件到 directus_files...");
    for (const config of avatarConfigs) {
      const files = [config.glb_file, config.preview];
      
      for (const filename of files) {
        if (!filename || filename === 'null') {
          console.log(`⚠️  文件名无效，跳过: ${filename}`);
          continue;
        }
        
        const filePath = path.join(__dirname, filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  文件不存在，跳过: ${filename}`);
          continue;
        }
        
        // 检查文件是否已经上传过
        if (uploadedFiles[filename]) {
          console.log(`✅ 文件已上传，跳过: ${filename} (ID: ${uploadedFiles[filename]})`);
          continue;
        }
        
        console.log(`📤 正在上传: ${filename}`);
        
        // 读取文件
        const fileBuffer = fs.readFileSync(filePath);
        const formData = new FormData();
        
        // 根据文件扩展名确定 MIME 类型
        let mimeType = 'application/octet-stream';
        if (filename.endsWith('.glb')) {
          mimeType = 'model/gltf-binary';
        } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (filename.endsWith('.png')) {
          mimeType = 'image/png';
        }
        
        // 创建 File 对象
        const file = new File([fileBuffer], filename, {
          type: mimeType
        });
        
        formData.append('file', file);
        formData.append('filename_download', filename);
        formData.append('title', filename.replace(/\.(glb|jpg|jpeg|png)$/, ''));
        formData.append('storage', 'local');
        
        // 上传文件
        const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (uploadRes.ok) {
          const result = await uploadRes.json();
          uploadedFiles[filename] = result.data.id;
          console.log(`✅ 上传成功: ${filename} (ID: ${result.data.id})`);
        } else {
          const errorData = await uploadRes.json();
          console.warn(`❌ 上传失败: ${filename}`, errorData);
        }
      }
    }
    
    // 第二步：创建 Avatar 记录
    console.log("\n🎭 第二步：创建 Avatar 记录...");
    for (const config of avatarConfigs) {
      const glbFileId = uploadedFiles[config.glb_file];
      const previewImageId = uploadedFiles[config.preview];
      
      if (!glbFileId) {
        console.log(`⚠️  GLB 文件未上传，跳过 Avatar: ${config.name}`);
        continue;
      }
      
      console.log(`🎭 正在创建 Avatar: ${config.name}`);
      
      // 创建 Avatar 记录，使用 CSV 中的所有字段
      const avatarData = {
        name: config.name,
        purpose: config.purpose,
        style: config.style,
        description: config.description,
        tags: config.tags, // 已经是数组格式
        glb_file: glbFileId,
        preview: previewImageId, // 只有当预览图片存在时才添加
        status: config.status
      };
      
      // 如果预览图片不存在，删除该字段
      if (!previewImageId) {
        delete avatarData.preview;
        console.log(`⚠️  预览图片未找到，仅创建 GLB 文件关联`);
      }
      
      const createRes = await fetch(`${DIRECTUS_URL}/items/avatars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(avatarData),
      });
      
      if (createRes.ok) {
        const result = await createRes.json();
        console.log(`✅ Avatar 创建成功: ${config.name} (ID: ${result.data.id})`);
        console.log(`   GLB 文件: ${glbFileId}`);
        if (previewImageId) {
          console.log(`   预览图片: ${previewImageId}`);
        }
        console.log(`   用途: ${config.purpose}, 风格: ${config.style}, 状态: ${config.status}`);
      } else {
        const errorData = await createRes.json();
        console.warn(`❌ Avatar 创建失败: ${config.name}`, errorData);
      }
    }
    
    console.log("✅ 文件上传和 Avatar 创建完成");
    
  } catch (error) {
    console.error("❌ 自动上传文件和创建 Avatar 失败:", error.message);
    console.log("⚠️  请手动操作 Directus 管理界面");
    console.log("🔗 Directus 管理界面: http://localhost:8055");
  }
  
  console.log("=====================================\n");
}

// 主流程
(async () => {
  try {
    console.log("🚀 开始设置 Directus 权限和导入数据...\n");

    // 1. 初始权限设置
    const token = await login();
    const roleId = await getPublicRoleId(token);
    await setFilesReadPermission(token, roleId);
    console.log("✅ 初始权限设置完成\n");

    // 2. 自动应用 schema 快照
    await applySchemaSnapshot();

    // 3. 重新设置权限（因为 schema 应用可能会重置权限）
    console.log("🔄 重新检查和设置权限...");
    const newToken = await login(); // 重新获取 token
    const newRoleId = await getPublicRoleId(newToken);
    await setFilesReadPermission(newToken, newRoleId);
    
    // 4. 确保 avatars 集合权限
    await ensureAvatarsPermissions(newToken);
    console.log("✅ 权限重新设置完成\n");

    // 5. 创建用户
    await createUsers(newToken);

    // 6. 自动上传文件并创建 Avatars
    await autoUploadFilesAndCreateAvatars();

    console.log("🎉 所有操作完成！Directus 设置和文件上传已完成。");
  } catch (err) {
    console.error("❌ 脚本执行失败:", err.message);
    console.error("详细错误:", err);
    process.exit(1);
  }
})();
