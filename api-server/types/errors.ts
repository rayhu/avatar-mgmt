// 通用错误类型定义
export interface AxiosErrorResponse {
  message?: string;
  response?: {
    status?: number;
    statusText?: string; // 添加 statusText 属性
    data?: {
      message?: string;
      error?: string;
      [key: string]: unknown;
    };
  };
  code?: string;
  constructor?: {
    name: string;
  };
}

// JWT 解码后的用户信息类型
export interface JWTDecoded {
  id: string;
  email: string;
  role: string;
  exp: number;
  first_name?: string;
  last_name?: string;
  roleId?: string;
  // directus_token 已移除 - 它是后台服务凭证，不应存储在 JWT 中
  [key: string]: unknown;
}

// 角色对象类型
export interface RoleObject {
  name?: string;
  [key: string]: unknown;
}

// 头像更新数据类型
export interface AvatarUpdateData {
  status?: string;
  version?: string;
  name?: string;
  description?: string;
}
