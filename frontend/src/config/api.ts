import { getEnvConfig, debugEnv } from './env';

// API 配置文件
export const API_CONFIG = {
  // 开发环境
  development: {
    api: {
      baseUrl: 'http://api.daidai.localhost:3000',
      endpoints: {
        avatars: '/avatars',
        health: '/health',
      }
    },
    directus: {
      baseUrl: 'http://directus.daidai.localhost:8055',
      endpoints: {
        assets: '/assets',
        auth: '/auth/login',
        models: '/items/models',
      }
    }
  },
  
  // 生产环境
  production: {
    api: {
      baseUrl: 'https://api.daidai.amis.hk',
      endpoints: {
        avatars: '/avatars',
        health: '/health',
      }
    },
    directus: {
      baseUrl: 'https://directus.daidai.amis.hk',
      endpoints: {
        assets: '/assets',
        auth: '/auth/login',
        models: '/items/models',
      }
    }
  }
};

// 获取当前环境配置
export function getApiConfig() {
  const env = import.meta.env.MODE || 'development';
  
  // 调试信息
  console.log('🌍 当前环境信息:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    BASE_URL: import.meta.env.BASE_URL,
    selectedEnv: env
  });
  
  // 显示环境配置
  debugEnv();
  
  return API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.development;
}

// API URL 构建器
export function buildApiUrl(endpoint: string): string {
  const config = getApiConfig();
  const url = `${config.api.baseUrl}${endpoint}`;
  console.log('🔗 API URL:', url);
  return url;
}

// Directus URL 构建器
export function buildDirectusUrl(endpoint: string): string {
  const config = getApiConfig();
  const url = `${config.directus.baseUrl}${endpoint}`;
  console.log('🔗 Directus URL:', url);
  return url;
} 
