import { Request, Response } from 'express';
import avatarHandler from '../../handlers/avatars.js';

// 模拟 axios
jest.mock('axios');
import axios from 'axios';
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('Avatars Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置环境变量
    process.env.DIRECTUS_URL = 'http://test-directus:8055';
    process.env.DIRECTUS_TOKEN = 'test-token';
    
    // 创建模拟的响应对象
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // 设置默认的模拟返回值
    mockAxios.get.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { 
        data: [
          { id: '1', name: 'Avatar 1', previewUrl: 'http://example.com/1.jpg' },
          { id: '2', name: 'Avatar 2', previewUrl: 'http://example.com/2.jpg' }
        ] 
      }
    });
  });

  afterEach(() => {
    delete process.env.DIRECTUS_URL;
    delete process.env.DIRECTUS_TOKEN;
  });

  describe('配置验证', () => {
    it('应该在Directus配置缺失时返回500错误', async () => {
      delete process.env.DIRECTUS_URL;
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Directus 配置缺失' });
    });

    it('应该在Directus Token缺失时返回500错误', async () => {
      delete process.env.DIRECTUS_TOKEN;
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Directus 配置缺失' });
    });
  });

  describe('成功查询', () => {
    it('应该成功查询avatars列表', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://test-directus:8055/items/avatars',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );

      expect(mockJson).toHaveBeenCalledWith([
        { id: '1', name: 'Avatar 1', previewUrl: 'http://example.com/1.jpg' },
        { id: '2', name: 'Avatar 2', previewUrl: 'http://example.com/2.jpg' }
      ]);
    });

    it('应该处理空的avatars列表', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { data: [] }
      });

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith([]);
    });

    it('应该处理null的avatars数据', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { data: null }
      });

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith([]);
    });

    it('应该处理undefined的avatars数据', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { data: undefined }
      });

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });

  describe('错误处理', () => {
    it('应该在网络连接错误时返回500错误', async () => {
      const networkError = new Error('ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockAxios.get.mockRejectedValue(networkError);

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: '查询avatars内容失败' });
    });

    it('应该在Directus API错误时返回500错误', async () => {
      mockAxios.get.mockRejectedValue({
        response: { 
          status: 500, 
          statusText: 'Internal Server Error',
          data: { message: 'Database error' }
        }
      });

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: '查询avatars内容失败' });
    });

    it('应该在Directus API返回404时返回500错误', async () => {
      mockAxios.get.mockRejectedValue({
        response: { 
          status: 404, 
          statusText: 'Not Found',
          data: { message: 'Endpoint not found' }
        }
      });

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: '查询avatars内容失败' });
    });

    it('应该在Directus API返回401时返回500错误', async () => {
      mockAxios.get.mockRejectedValue({
        response: { 
          status: 401, 
          statusText: 'Unauthorized',
          data: { message: 'Invalid token' }
        }
      });

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: '查询avatars内容失败' });
    });

    it('应该在通用错误时返回500错误', async () => {
      mockAxios.get.mockRejectedValue(new Error('Generic error'));

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: '查询avatars内容失败' });
    });
  });

  describe('日志记录', () => {
    it('应该记录请求开始信息', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('🖼️ Avatars 请求开始:', {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      });

      consoleSpy.mockRestore();
    });

    it('应该记录配置检查信息', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('📋 配置检查:', {
        directusUrl: '已配置',
        directusToken: '已配置',
        nodeEnv: 'test'
      });

      consoleSpy.mockRestore();
    });

    it('应该记录Directus API调用信息', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('🌐 调用 Directus API:', {
        url: 'http://test-directus:8055/items/avatars',
        tokenLength: 10
      });

      consoleSpy.mockRestore();
    });

    it('应该记录Directus响应信息', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('📥 Directus 响应:', {
        status: 200,
        statusText: 'OK',
        dataCount: 2
      });

      consoleSpy.mockRestore();
    });

    it('应该记录成功查询信息', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('✅ Avatars 查询成功:', {
        avatarCount: 2
      });

      consoleSpy.mockRestore();
    });

    it('应该记录错误信息', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAxios.get.mockRejectedValue(new Error('Test error'));

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Avatars handler 错误:', {
        error: 'Test error',
        errorType: 'Error',
        stack: expect.any(String)
      });

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('应该记录网络连接错误', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const networkError = new Error('ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockAxios.get.mockRejectedValue(networkError);

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('🌐 网络连接错误: Directus 服务器无法访问');

      consoleErrorSpy.mockRestore();
    });

    it('应该记录Directus API错误详情', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAxios.get.mockRejectedValue({
        response: { 
          status: 500, 
          statusText: 'Internal Server Error',
          data: { message: 'Database error' }
        }
      });

      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('📥 Directus API 错误:', {
        status: 500,
        statusText: 'Internal Server Error',
        data: '{\n  "message": "Database error"\n}'
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('环境变量处理', () => {
    it('应该正确处理NODE_ENV环境变量', async () => {
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'GET',
        url: '/api/avatars',
        headers: { 'user-agent': 'jest-test' },
        query: {}
      };

      await avatarHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('📋 配置检查:', {
        directusUrl: '已配置',
        directusToken: '已配置',
        nodeEnv: 'production'
      });

      consoleSpy.mockRestore();
      delete process.env.NODE_ENV;
    });
  });
});
