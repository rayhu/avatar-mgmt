// API 配置类型定义
export interface ApiConfig {
  api: {
    baseUrl: string;
    endpoints: {
      avatars: string;
      health: string;
    };
  };
  directus: {
    baseUrl: string;
    endpoints: {
      assets: string;
      auth: string;
      models: string;
    };
  };
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
