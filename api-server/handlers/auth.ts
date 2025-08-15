import { Request, Response } from 'express';

// 测试账户配置（临时硬编码，后续会连接到 Directus）
const TEST_ACCOUNTS: Record<string, { password: string; role: 'admin' | 'user'; name: string }> = {
  admin: {
    password: 'admin123',
    role: 'admin',
    name: 'Administrator'
  },
  user: {
    password: 'user123',
    role: 'user',
    name: 'Regular User'
  }
};

// 简单的 JWT 模拟（实际项目中应该使用真实的 JWT 库）
function generateMockToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24小时过期
    iat: Math.floor(Date.now() / 1000)
  };
  
  // 简单的 base64 编码（仅用于测试）
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export default async function authHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // 验证请求参数
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required'
      });
    }

    // 查找用户账户
    const normalizedUsername = username.toLowerCase();
    const account = TEST_ACCOUNTS[normalizedUsername];

    if (!account || account.password !== password) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    // 生成模拟 token
    const token = generateMockToken(username, account.role);

    // 返回成功响应
    res.json({
      success: true,
      user: {
        id: username, // 保持原始大小写
        role: account.role,
        name: account.name
      },
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during authentication'
    });
  }
}
