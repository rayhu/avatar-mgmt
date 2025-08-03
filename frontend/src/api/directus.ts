import { logger } from '@/utils/logger';
import { getDirectusUrl } from '@/config/api';

export async function login(_email: string, _password: string) {
  logger.info('Directus 登录请求', {
    component: 'DirectusAPI',
    method: 'login',
    email: _email.slice(0, 3) + '***' // 隐藏邮箱内容
  });
  
  // TODO: 调用 Directus Auth API
  // const url = getDirectusUrl('auth');
  // return axios.post(url, { email: username, password });
  
  logger.info('Directus 登录成功 (mock)', {
    component: 'DirectusAPI',
    method: 'login',
    userRole: 'admin'
  });
  
  return { user: { id: '1', role: 'admin', name: _email }, token: 'mock-token' };
}

export async function logout(_token: string) {
  logger.info('Directus 登出请求', {
    component: 'DirectusAPI',
    method: 'logout',
    tokenLength: _token.length
  });
  
  // Implementation
  logger.info('Directus 登出成功', {
    component: 'DirectusAPI',
    method: 'logout'
  });
}

export async function fetchModels(_token: string) {
  const url = getDirectusUrl('models');
  
  logger.apiCall('Directus Models', url, {
    component: 'DirectusAPI',
    method: 'fetchModels',
    tokenLength: _token.length
  });
  
  // TODO: 拉取模型列表
  // return axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  
  logger.info('获取模型列表成功 (mock)', {
    component: 'DirectusAPI',
    method: 'fetchModels',
    modelCount: 0
  });
  
  return [];
}
