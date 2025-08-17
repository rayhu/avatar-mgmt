import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import authHandler from '../../handlers/auth.js';

// Mock axios for Directus API calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  }
}));

// Import mocked modules
import axios from 'axios';
import jwt from 'jsonwebtoken';

describe('Auth Handler (Vitest)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: any;
  let mockJson: any;

  const originalEnv = process.env;

  beforeEach(() => {
    mockStatus = vi.fn().mockReturnThis();
    mockJson = vi.fn().mockReturnThis();
    
    mockReq = {
      method: 'POST',
      body: {}
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // Setup environment variables
    process.env.DIRECTUS_URL = 'http://localhost:8055';
    process.env.JWT_SECRET = 'test-jwt-secret';

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('HTTP方法验证', () => {
    it('应该拒绝非POST请求', async () => {
      mockReq.method = 'GET';

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('应该接受POST请求', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };

      // Mock successful responses
      const mockDirectusAuthResponse = {
        data: {
          data: {
            access_token: 'directus-token',
            expires: 3600,
            refresh_token: 'refresh-token'
          }
        }
      };

      const mockDirectusUserResponse = {
        data: {
          data: {
            id: 'user-id',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'user-role-id' // 这是角色ID，不是角色对象
          }
        }
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockDirectusAuthResponse);
      vi.mocked(axios.get).mockResolvedValueOnce(mockDirectusUserResponse);
      vi.mocked(jwt.sign).mockReturnValue('custom-jwt-token' as any);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).not.toHaveBeenCalledWith(405);
    });
  });

  describe('参数验证', () => {
    it('应该验证必需的email参数', async () => {
      mockReq.body = { password: 'password123' };

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    });

    it('应该验证必需的password参数', async () => {
      mockReq.body = { email: 'test@example.com' };

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    });

    it('应该拒绝空的email参数', async () => {
      mockReq.body = { email: '', password: 'password123' };

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    });
  });

  describe('Directus认证流程', () => {
    beforeEach(() => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
    });

    it('应该成功调用Directus登录API', async () => {
      const mockDirectusAuthResponse = {
        data: {
          data: {
            access_token: 'directus-token',
            expires: 3600,
            refresh_token: 'refresh-token'
          }
        }
      };
      
      const mockDirectusUserResponse = {
        data: {
          data: {
            id: 'user-id',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'user-role-id' // 这是角色ID，不是角色对象
          }
        }
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockDirectusAuthResponse);
      vi.mocked(axios.get).mockResolvedValueOnce(mockDirectusUserResponse);
      vi.mocked(jwt.sign).mockReturnValue('custom-jwt-token' as any);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8055/auth/login',
        {
          email: 'test@example.com',
          password: 'password123'
        }
      );
    });

    it('应该成功调用Directus用户信息API', async () => {
      const mockDirectusAuthResponse = {
        data: {
          data: {
            access_token: 'directus-token',
            expires: 3600,
            refresh_token: 'refresh-token'
          }
        }
      };
      
      const mockDirectusUserResponse = {
        data: {
          data: {
            id: 'user-id',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'user-role-id' // 这是角色ID，不是角色对象
          }
        }
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockDirectusAuthResponse);
      vi.mocked(axios.get).mockResolvedValueOnce(mockDirectusUserResponse);
      vi.mocked(jwt.sign).mockReturnValue('custom-jwt-token' as any);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8055/users/me',
        {
          headers: {
            Authorization: 'Bearer directus-token'
          }
        }
      );
    });

    it('应该生成自定义JWT令牌', async () => {
      const mockDirectusAuthResponse = {
        data: {
          data: {
            access_token: 'directus-token',
            expires: 3600,
            refresh_token: 'refresh-token'
          }
        }
      };
      
      const mockDirectusUserResponse = {
        data: {
          data: {
            id: 'user-id',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: { name: 'user' }
          }
        }
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockDirectusAuthResponse);
      vi.mocked(axios.get).mockResolvedValueOnce(mockDirectusUserResponse);
      vi.mocked(jwt.sign).mockReturnValue('custom-jwt-token' as any);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-id',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          roleId: { name: 'user' },
          directus_token: 'directus-token'
        }),
        'test-jwt-secret'
      );
    });

    it('应该返回成功的认证响应', async () => {
      const mockDirectusAuthResponse = {
        data: {
          data: {
            access_token: 'directus-token',
            expires: 3600,
            refresh_token: 'refresh-token'
          }
        }
      };
      
      const mockDirectusUserResponse = {
        data: {
          data: {
            id: 'user-id',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: { name: 'user' }
          }
        }
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockDirectusAuthResponse);
      vi.mocked(axios.get).mockResolvedValueOnce(mockDirectusUserResponse);
      vi.mocked(jwt.sign).mockReturnValue('custom-jwt-token' as any);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          first_name: 'Test',
          last_name: 'User'
        },
        token: 'custom-jwt-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        message: 'Login successful'
      });
    });
  });

  describe('错误处理', () => {
    beforeEach(() => {
      mockReq.body = { email: 'test@example.com', password: 'wrongpassword' };
    });

    it('应该处理Directus认证错误（401）', async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };

      vi.mocked(axios.post).mockRejectedValueOnce(authError);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    });

    it('应该处理网络连接错误', async () => {
      const networkError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      vi.mocked(axios.post).mockRejectedValueOnce(networkError);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Service unavailable',
        message: 'Unable to connect to authentication service'
      });
    });

    it('应该处理通用错误', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('Unexpected error'));

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred during authentication'
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理缺少first_name和last_name的用户', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };

      const mockDirectusAuthResponse = {
        data: {
          data: {
            access_token: 'directus-token',
            expires: 3600,
            refresh_token: 'refresh-token'
          }
        }
      };
      
      const mockDirectusUserResponse = {
        data: {
          data: {
            id: 'user-id',
            email: 'test@example.com',
            role: { name: 'user' }
          }
        }
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockDirectusAuthResponse);
      vi.mocked(axios.get).mockResolvedValueOnce(mockDirectusUserResponse);
      vi.mocked(jwt.sign).mockReturnValue('custom-jwt-token' as any);

      await authHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            name: 'test@example.com' // 应该回退到email作为名称
          })
        })
      );
    });
  });
});
