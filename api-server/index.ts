import 'dotenv/config';


import express from 'express';

import openaiHandler from './handlers/openai-ssml';
import azureTTSHandler from './handlers/azure-tts';
import avatarsHandler from './handlers/avatars';
import generateSSMLHandler from './handlers/generate-ssml';
import avatarManagementHandler from './handlers/avatar-management';

const app = express();

// 添加 CORS 支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '2mb' }));

app.post('/api/openai-ssml', openaiHandler);
app.post('/api/azure-tts', azureTTSHandler);
app.post('/api/generate-ssml', generateSSMLHandler);
app.get('/api/avatars', avatarsHandler);

// Avatar 管理路由
app.put('/api/avatars/:id', avatarManagementHandler);
app.patch('/api/avatars/:id', avatarManagementHandler);

app.get('/health', (_req, res) => res.send('ok'));

// 显示重要的环境变量配置
function displayEnvironmentConfig() {
  console.log('\n🌍 ========== 环境变量配置 ==========');
  console.log(`📌 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 PORT: ${process.env.PORT || '3000'}`);
  console.log(`🏗️ DIRECTUS_URL: ${process.env.DIRECTUS_URL || '❌ 未配置'}`);
  if (process.env.DIRECTUS_TOKEN) {
    const token = process.env.DIRECTUS_TOKEN;
    const len = token.length;
    const start = token.slice(0, 4);
    const end = token.slice(-4);
    console.log(`🔑 DIRECTUS_TOKEN: ✅ 已配置 (长度: ${len}, 开头: ${start}, 结尾: ${end})`);
  } else {
    console.log('🔑 DIRECTUS_TOKEN: ❌ 未配置');
  }

  // 显示其他相关环境变量
  const otherEnvs = [
    'OPENAI_API_KEY', 'AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION'
  ];
  
  const configuredEnvs = otherEnvs.filter(env => process.env[env]);
  if (configuredEnvs.length > 0) {
    console.log('\n📋 其他配置:');
    configuredEnvs.forEach(env => {
      const value = process.env[env];
      if (env.includes('PASSWORD') || env.includes('TOKEN') || env === 'SECRET' || env === 'KEY') {
        console.log(`   ${env}: ✅ 已配置 (长度: ${value?.length})`);
      } else {
        console.log(`   ${env}: ${value}`);
      }
    });
  }
  
  console.log('=====================================\n');
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 Avatar API Server listening on port ${port}`);
  displayEnvironmentConfig();
  
  // 验证关键配置
  if (!process.env.DIRECTUS_URL || !process.env.DIRECTUS_TOKEN) {
    console.log('⚠️  警告: Directus 配置不完整，某些功能可能无法正常工作!');
  } else {
    console.log('✅ 所有关键配置已就绪!');
  }
}); 
