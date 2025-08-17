import { logger } from '@/utils/logger';
import apiClient from './axios';

export async function login(email: string, password: string) {
  logger.info('认证登录请求', {
    component: 'AuthAPI',
    method: 'login',
    email: email.slice(0, 3) + '***' // 隐藏邮箱内容
  });
  
  try {
    const response = await apiClient.post('/api/auth/login', { email, password });
    
    logger.info('认证登录成功', {
      component: 'AuthAPI',
      method: 'login',
      userRole: response.data.user.role,
      userId: response.data.user.id
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('认证登录失败', {
      component: 'AuthAPI',
      method: 'login',
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    });
    throw error;
  }
}

export async function logout(refreshToken?: string) {
  logger.info('认证登出请求', {
    component: 'AuthAPI',
    method: 'logout'
  });
  
  try {
    await apiClient.post('/api/auth/logout', { refresh_token: refreshToken });
    
    logger.info('认证登出成功', {
      component: 'AuthAPI',
      method: 'logout'
    });
  } catch (error: any) {
    logger.error('认证登出失败', {
      component: 'AuthAPI',
      method: 'logout',
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    });
    // Don't throw error for logout - we still want to clear local state
  }
}
