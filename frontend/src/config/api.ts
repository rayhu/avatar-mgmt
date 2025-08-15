// API 配置文件

// 公共的 API endpoints 配置
const COMMON_API_ENDPOINTS = {
  avatars: '/api/avatars',
  health: '/health',
  openaiSSML: '/api/openai-ssml',
  azureTTS: '/api/azure-tts',
  generateSSML: '/api/generate-ssml',
  version: '/api/version',
  auth: {
    login: '/api/auth/login'
  }
} as const;

// 公共的 Directus endpoints 配置
const COMMON_DIRECTUS_ENDPOINTS = {
  assets: '/assets',
  auth: '/auth/login',
  models: '/items/models',
} as const;

// 从环境变量获取 baseUrl，如果没有则使用默认值
function getBaseUrls() {
  const env = import.meta.env.MODE || 'development';
  
  // 从环境变量读取，格式：VITE_API_BASE_URL, VITE_DIRECTUS_BASE_URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const directusBaseUrl = import.meta.env.VITE_DIRECTUS_BASE_URL;
  
  // 默认值配置
  const defaults = {
    development: {
      api: 'http://api.daidai.localhost:3000',
      directus: 'http://directus.daidai.localhost:8055'
    },
    stage: {
      api: 'https://api.daidai-preview.amis.hk',
      directus: 'https://directus.daidai-preview.amis.hk'
    },
    production: {
      api: 'https://api.daidai.amis.hk',
      directus: 'https://directus.daidai.amis.hk'
    }
  };
  
  const defaultConfig = defaults[env as keyof typeof defaults] || defaults.development;
  
  return {
    api: apiBaseUrl || defaultConfig.api,
    directus: directusBaseUrl || defaultConfig.directus
  };
}

export const API_CONFIG = {
  // 开发环境
  development: {
    api: {
      baseUrl: getBaseUrls().api,
      endpoints: COMMON_API_ENDPOINTS
    },
    directus: {
      baseUrl: getBaseUrls().directus,
      endpoints: COMMON_DIRECTUS_ENDPOINTS
    }
  },
  
  // Stage 环境
  stage: {
    api: {
      baseUrl: getBaseUrls().api,
      endpoints: COMMON_API_ENDPOINTS
    },
    directus: {
      baseUrl: getBaseUrls().directus,
      endpoints: COMMON_DIRECTUS_ENDPOINTS
    }
  },
  
  // 生产环境
  production: {
    api: {
      baseUrl: getBaseUrls().api,
      endpoints: COMMON_API_ENDPOINTS
    },
    directus: {
      baseUrl: getBaseUrls().directus,
      endpoints: COMMON_DIRECTUS_ENDPOINTS
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
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_DIRECTUS_BASE_URL: import.meta.env.VITE_DIRECTUS_BASE_URL,
    selectedEnv: env
  });
  
  const config = API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.development;
  
  // 显示最终配置
  console.log('🌍 最终 API 配置:', {
    env: env,
    apiBaseUrl: config.api.baseUrl,
    directusBaseUrl: config.directus.baseUrl
  });
  
  return config;
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

// 构建 Directus 资产 URL
export function buildDirectusAssetUrl(fileId: string): string {
  const config = getApiConfig();
  const url = `${config.directus.baseUrl}/assets/${fileId}`;
  return url;
} 
