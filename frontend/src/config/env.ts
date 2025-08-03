// 环境变量配置
export const ENV_CONFIG = {
  // 开发环境
  development: {
    mode: 'development',
    apiBaseUrl: 'http://api.daidai.localhost:3000',
    directusBaseUrl: 'http://directus.daidai.localhost:8055',
    frontendBaseUrl: 'http://daidai.localhost:5173',
  },
  
  // 生产环境
  production: {
    mode: 'production',
    apiBaseUrl: 'https://api.daidai.amis.hk',
    directusBaseUrl: 'https://directus.daidai.amis.hk',
    frontendBaseUrl: 'https://daidai.amis.hk',
  }
};

// 获取当前环境
export function getCurrentEnv() {
  return import.meta.env.MODE || 'development';
}

// 获取环境配置
export function getEnvConfig() {
  const env = getCurrentEnv();
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
}

// 调试环境信息
export function debugEnv() {
  console.log('🔧 环境变量:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    BASE_URL: import.meta.env.BASE_URL,
    NODE_ENV: import.meta.env.NODE_ENV,
  });
  
  console.log('🌍 当前环境配置:', getEnvConfig());
} 
