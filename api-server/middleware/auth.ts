import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
    directus_token: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login first'
    });
  }

  // 添加调试信息
  console.log('🔍 Admin 权限检查:', {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    roleType: typeof req.user.role,
    fullUser: req.user
  });

  // Check if user has admin role
  const userRole = req.user.role;
  
  // 支持多种管理员角色名称
  const adminRoleNames = [
    'Administrator', 'admin', 'Admin', 'ADMIN', 'administrator',
    'super_admin', 'superadmin', 'Super Admin', 'SuperAdmin'
  ];
  
  const isAdmin = adminRoleNames.includes(userRole) || 
                  (typeof userRole === 'object' && userRole?.name && adminRoleNames.includes(userRole.name));

  console.log('🔍 权限检查结果:', {
    userRole,
    isAdmin,
    adminChecks: {
      directMatch: adminRoleNames.includes(userRole),
      objectMatch: typeof userRole === 'object' && userRole?.name && adminRoleNames.includes(userRole.name),
      supportedRoles: adminRoleNames
    }
  });

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required',
      debug: {
        userRole,
        requiredRoles: ['admin', 'Administrator']
      }
    });
  }

  console.log('✅ 用户具有管理员权限');
  next();
}
