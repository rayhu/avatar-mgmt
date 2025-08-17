import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export default async function authHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // 验证请求参数
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    if (!DIRECTUS_URL) {
      throw new Error('DIRECTUS_URL not configured');
    }

    // 调用 Directus 认证 API
    const directusResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email,
      password
    });

    const { access_token, expires, refresh_token } = directusResponse.data.data;

    // 使用 Directus 返回的 access_token 获取用户信息
    const userResponse = await axios.get(`${DIRECTUS_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const userData = userResponse.data.data;

    // 获取角色详细信息
    let roleName = 'user'; // 默认角色
    if (userData.role) {
      try {
        const roleResponse = await axios.get(`${DIRECTUS_URL}/roles/${userData.role}`, {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        });
        
        const roleData = roleResponse.data.data;
        roleName = roleData.name || 'user';
        
        console.log('🔍 角色信息获取成功:', {
          roleId: userData.role,
          roleName: roleName,
          roleData: roleData
        });
      } catch (roleError) {
        console.warn('⚠️ 获取角色信息失败，使用默认角色:', roleError.message);
        // 如果获取角色信息失败，尝试从用户数据中推断
        if (typeof userData.role === 'string' && userData.role.length > 20) {
          // 这是一个 UUID，可能是管理员角色
          roleName = 'Administrator'; // 假设是管理员
        }
      }
    }

    // 获取用户角色信息
    let userRole = 'user';
    if (roleName === 'Administrator' || roleName === 'admin' || roleName === 'Admin') {
      userRole = 'admin';
    } else if (roleName === 'user' || roleName === 'User') {
      userRole = 'user';
    }

    console.log('🔍 用户角色信息:', {
      originalRole: userData.role,
      roleName: roleName,
      processedRole: userRole,
      roleType: typeof userData.role
    });

    // 生成我们自己的 JWT token，包含用户信息
    const customToken = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userRole, // 使用处理后的角色名称
        roleId: userData.role, // 保存原始角色ID
        directus_token: access_token, // 保存 Directus token 用于后续 API 调用
        exp: Math.floor(Date.now() / 1000) + expires
      },
      JWT_SECRET
    );

    // 返回成功响应
    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email,
        role: userRole, // 使用处理后的角色名称
        first_name: userData.first_name,
        last_name: userData.last_name
      },
      token: customToken,
      refresh_token,
      expires_in: expires,
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Authentication error:', error);

    // 处理 Directus 认证错误
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // 处理网络或其他错误
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Unable to connect to authentication service'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during authentication'
    });
  }
}
