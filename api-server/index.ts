import 'dotenv/config';

import express from 'express';
import { Logger } from './utils/logger';

import openaiHandler from './handlers/openai-ssml';
import azureTTSHandler from './handlers/azure-tts';
import avatarsHandler from './handlers/avatars';
import generateSSMLHandler from './handlers/generate-ssml';
import avatarManagementHandler from './handlers/avatar-management';
import versionHandler from './handlers/version';
import authHandler from './handlers/auth';
import logoutHandler from './handlers/logout';
import { authenticateToken, requireAdmin } from './middleware/auth';
import { assetsHandler } from './handlers/assets';

const app = express();

// 添加 CORS 支持
app.use((req, res, next) => {
  // 安全的 CORS 配置 - 明确定义允许的源
  const corsOrigin = process.env.CORS_ORIGIN;
  const allowedOrigins = corsOrigin ? corsOrigin.split(',') : [
    'http://localhost:5173',        // Frontend dev server
    'http://localhost:3000',        // API dev server
    'https://daidai.amis.hk',       // Production
    'https://daidai-preview.amis.hk', // Staging
  ];
  
  const origin = req.headers.origin;
  
  // 处理 CORS 策略
  if (corsOrigin === '*' || allowedOrigins.includes('*')) {
    // 允许所有源
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    // 允许特定源
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // 没有 origin 的请求（如 Postman、curl 等）
    // 在开发环境中允许，生产环境中应该更严格
    if (process.env.NODE_ENV === 'development') {
      res.header('Access-Control-Allow-Origin', '*');
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
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

// 认证路由
app.post('/api/auth/login', authHandler);
app.post('/api/auth/logout', authenticateToken, logoutHandler);

// Protected Avatar 管理路由 (需要管理员权限)
app.put('/api/avatars/:id', authenticateToken, requireAdmin, avatarManagementHandler);
app.patch('/api/avatars/:id', authenticateToken, requireAdmin, avatarManagementHandler);

// 版本信息路由
app.get('/api/version', versionHandler);

// Assets 代理路由 (用于代理Directus文件)
app.get('/api/assets/:fileId', assetsHandler);

app.get('/health', (_req, res) => res.send('ok'));

// 显示重要的环境变量配置
function displayEnvironmentConfig() {
  Logger.info('========== 环境变量配置 ==========');
  Logger.info(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  Logger.info(`PORT: ${process.env.PORT || '3000'}`);
  Logger.info(`DIRECTUS_URL: ${process.env.DIRECTUS_URL || '❌ 未配置'}`);
  if (process.env.DIRECTUS_TOKEN) {
    const token = process.env.DIRECTUS_TOKEN;
    const len = token.length;
    const start = token.slice(0, 4);
    const end = token.slice(-4);
    Logger.info(`DIRECTUS_TOKEN: ✅ 已配置 (长度: ${len}, 开头: ${start}, 结尾: ${end})`);
  } else {
    Logger.error('DIRECTUS_TOKEN: ❌ 未配置');
  }

  // 显示其他相关环境变量
  const otherEnvs = [
    'OPENAI_API_KEY', 'AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION', 'CORS_ORIGIN'
  ];
  
  const configuredEnvs = otherEnvs.filter(env => process.env[env]);
  if (configuredEnvs.length > 0) {
    Logger.info('其他配置:');
    configuredEnvs.forEach(env => {
      const value = process.env[env];
      if (env.includes('PASSWORD') || env.includes('TOKEN') || env === 'SECRET' || env === 'KEY') {
        Logger.info(`   ${env}: ✅ 已配置 (长度: ${value?.length})`);
      } else {
        Logger.info(`   ${env}: ${value}`);
      }
    });
  }
  
  Logger.info('=====================================');
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// 启动服务器
app.listen(port, () => {
  Logger.info(`Avatar API Server listening on port ${port}`);
  displayEnvironmentConfig();
  
  // 验证关键配置
  if (!process.env.DIRECTUS_URL || !process.env.DIRECTUS_TOKEN) {
    Logger.warn('⚠️  警告: Directus 配置不完整，某些功能可能无法正常工作!');
  } else {
    Logger.info('✅ 所有关键配置已就绪!');
  }
}); 
