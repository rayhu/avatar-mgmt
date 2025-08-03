// API 配置文件
export const API_CONFIG = {
  // 开发环境
  development: {
    api: {
      baseUrl: 'http://api.daidai.localhost:3000',
      endpoints: {
        avatars: '/api/avatars',
        health: '/health',
        openaiSSML: '/api/openai-ssml',
        azureTTS: '/api/azure-tts',
        generateSSML: '/api/generate-ssml',
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
  
  // Stage 环境
  stage: {
    api: {
      baseUrl: 'http://api.daidai.localhost:3000',
      endpoints: {
        avatars: '/api/avatars',
        health: '/health',
        openaiSSML: '/api/openai-ssml',
        azureTTS: '/api/azure-tts',
        generateSSML: '/api/generate-ssml',
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
        avatars: '/api/avatars',
        health: '/health',
        openaiSSML: '/api/openai-ssml',
        azureTTS: '/api/azure-tts',
        generateSSML: '/api/generate-ssml',
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
  console.log('🌍 当前环境配置:', API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.development);
  
  return API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.development;
}

// 便捷的 API URL 构建器 - 直接使用配置中的 endpoints
export function getApiUrl(endpointKey: keyof typeof API_CONFIG.development.api.endpoints): string {
  const config = getApiConfig();
  const url = `${config.api.baseUrl}${config.api.endpoints[endpointKey]}`;
  console.log('🔗 API URL:', url);
  return url;
}

// 便捷的 Directus URL 构建器 - 直接使用配置中的 endpoints
export function getDirectusUrl(endpointKey: keyof typeof API_CONFIG.development.directus.endpoints): string {
  const config = getApiConfig();
  const url = `${config.directus.baseUrl}${config.directus.endpoints[endpointKey]}`;
  console.log('🔗 Directus URL:', url);
  return url;
} 
