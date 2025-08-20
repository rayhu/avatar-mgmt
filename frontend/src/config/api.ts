// API 配置文件

// 公共的 API endpoints 配置
const COMMON_API_ENDPOINTS = {
  avatars: '/api/avatars',
  health: '/health',
  openaiSSML: '/api/openai-ssml',
  azureTTS: '/api/azure-tts',
  generateSSML: '/api/generate-ssml',
  version: '/api/version',
  assets: '/api/assets',
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
  },
} as const;

// 从运行时配置获取 baseUrl
function getBaseUrls() {
  // 优先使用运行时配置
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    console.log(' 使用运行时配置:', window.APP_CONFIG);
    return {
      api: window.APP_CONFIG.API_BASE_URL,
    };
  }

  // 降级到环境变量（开发环境）
  const env = import.meta.env.MODE || 'development';
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  // 默认值配置
  const defaults = {
    development: {
      api: 'http://localhost:3000',
    },
    stage: {
      api: 'https://api.daidai-preview.amis.hk',
    },
    production: {
      api: 'https://api.daidai.amis.hk',
    },
  };

  const defaultConfig = defaults[env as keyof typeof defaults] || defaults.development;
  const finalApiBaseUrl = apiBaseUrl || defaultConfig.api;

  console.log(' 使用环境变量配置:', { env, apiBaseUrl: finalApiBaseUrl });

  return {
    api: finalApiBaseUrl,
  };
}

export const API_CONFIG = {
  // 开发环境
  development: {
    api: {
      baseUrl: getBaseUrls().api,
      endpoints: COMMON_API_ENDPOINTS,
    },
  },

  // Stage 环境
  stage: {
    api: {
      baseUrl: getBaseUrls().api,
      endpoints: COMMON_API_ENDPOINTS,
    },
  },

  // 生产环境
  production: {
    api: {
      baseUrl: getBaseUrls().api,
      endpoints: COMMON_API_ENDPOINTS,
    },
  },
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
    VITE_API_URL: import.meta.env.VITE_API_URL,
    selectedEnv: env,
    runtimeConfig: typeof window !== 'undefined' ? window.APP_CONFIG : 'undefined',
  });

  const config = API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.development;

  // 显示最终配置
  console.log(' 最终 API 配置:', {
    env: env,
    apiBaseUrl: config.api.baseUrl,
    runtimeConfig: typeof window !== 'undefined' ? window.APP_CONFIG : 'undefined',
  });

  return config;
}

// 便捷的 API URL 构建器 - 支持嵌套的 endpoint 结构
export function getApiUrl(endpointKey: string): string {
  const config = getApiConfig();

  // 处理嵌套的 endpoint 结构
  let endpoint: string;
  if (endpointKey.includes('.')) {
    // 处理嵌套结构，如 'auth.login'
    const [category, subKey] = endpointKey.split('.');
    endpoint = (config.api.endpoints as any)[category]?.[subKey];
  } else {
    // 处理直接的 endpoint
    endpoint = (config.api.endpoints as any)[endpointKey];
  }

  if (!endpoint) {
    console.error('❌ 无效的 endpoint key:', endpointKey);
    throw new Error(`Invalid endpoint key: ${endpointKey}`);
  }

  const url = `${config.api.baseUrl}${endpoint}`;
  console.log(' API URL:', url);
  return url;
}

// 构建资源文件 URL - 通过 API Server 代理
export function buildAssetUrl(fileId: string): string {
  const config = getApiConfig();

  if (!fileId) {
    console.warn('⚠️ buildAssetUrl: fileId 为空');
    return '';
  }

  const url = `${config.api.baseUrl}${config.api.endpoints.assets}/${fileId}`;
  console.log(' 资源文件 URL:', url);
  return url;
}
