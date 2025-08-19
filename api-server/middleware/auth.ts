import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger.js';
import { JWTDecoded, RoleObject } from '../types/errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
    // directus_token 不应该在这里，它是程序化访问 Directus 的凭证
    // 如果需要访问 Directus，应该通过其他方式获取
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTDecoded;
    req.user = decoded;
    next();
  } catch (error) {
    Logger.error('Token verification error', { error: error.message });
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired',
    });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login first',
    });
  }

  // 添加调试信息
  Logger.debug('Admin 权限检查', {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    roleType: typeof req.user.role,
    fullUser: req.user,
  });

  // Check if user has admin role
  const userRole = req.user.role;

  // 支持多种管理员角色名称
  const adminRoleNames = [
    'Administrator',
    'admin',
    'Admin',
    'ADMIN',
    'administrator',
    'super_admin',
    'superadmin',
    'Super Admin',
    'SuperAdmin',
  ];

  // 简化角色检查逻辑
  let isAdmin = adminRoleNames.includes(userRole);

  // 如果直接匹配失败，尝试检查对象格式的角色
  if (!isAdmin && typeof userRole === 'object' && userRole !== null) {
    const roleObj = userRole as RoleObject;
    if (roleObj.name && typeof roleObj.name === 'string') {
      isAdmin = adminRoleNames.includes(roleObj.name);
    }
  }

  Logger.debug('权限检查结果', {
    userRole,
    isAdmin,
    adminChecks: {
      directMatch: adminRoleNames.includes(userRole),
      objectMatch:
        typeof userRole === 'object' &&
        userRole !== null &&
        (userRole as RoleObject).name &&
        adminRoleNames.includes((userRole as RoleObject).name),
      supportedRoles: adminRoleNames,
    },
  });

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required',
      debug: {
        userRole,
        requiredRoles: ['admin', 'Administrator'],
      },
    });
  }

  Logger.info('用户具有管理员权限');
  next();
}
