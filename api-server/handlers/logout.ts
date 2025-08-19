import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Logger } from '../utils/logger.js';

export default async function logoutHandler(req: AuthenticatedRequest, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // JWT 登出逻辑：客户端删除 token 即可
    // Directus token 是后台服务凭证，与用户登录状态无关

    Logger.info('用户登出', {
      userId: req.user?.id,
      userEmail: req.user?.email,
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    Logger.error('登出错误', { error: error.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during logout',
    });
  }
}
