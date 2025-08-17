import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import avatarManagementHandler from '../../handlers/avatar-management.js';

// 模拟 axios
vi.mock('axios', () => ({
  default: {
    patch: vi.fn()
  }
}));
import axios from 'axios';
const mockAxios = vi.mocked(axios);

describe('Avatar Management Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: any;
  let mockJson: any;

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();
    
    // 设置环境变量
    process.env.DIRECTUS_URL = 'http://test-directus:8055';
    process.env.DIRECTUS_TOKEN = 'test-token';
    
    // 创建模拟的响应对象
    mockStatus = vi.fn().mockReturnThis();
    mockJson = vi.fn().mockReturnThis();
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // 设置默认的模拟返回值
    vi.mocked(mockAxios.patch).mockResolvedValue({
      status: 200,
      data: { data: { id: 'test-id', name: 'Test Avatar' } }
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
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: {},
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Directus 配置缺失' });
    });

    it('应该在Directus Token缺失时返回500错误', async () => {
      delete process.env.DIRECTUS_TOKEN;
      
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: {},
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Directus 配置缺失' });
    });
  });

  describe('HTTP方法验证', () => {
    it('应该拒绝不支持的HTTP方法', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: {},
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({ error: '不支持的HTTP方法' });
    });

    it('应该支持PUT方法', async () => {
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready', version: '1.0.0' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(vi.mocked(mockAxios.patch)).toHaveBeenCalled();
    });

    it('应该支持PATCH方法', async () => {
      mockReq = {
        method: 'PATCH',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { name: 'Updated Avatar' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(vi.mocked(mockAxios.patch)).toHaveBeenCalled();
    });
  });

  describe('PUT方法 - 更新模型状态', () => {
    it('应该成功更新模型状态', async () => {
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready', version: '1.0.0' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(vi.mocked(mockAxios.patch)).toHaveBeenCalledWith(
        'http://test-directus:8055/items/avatars/test-id',
        { status: 'ready', version: '1.0.0' },
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 'test-id', name: 'Test Avatar' },
        message: '模型状态更新成功'
      });
    });

    it('应该验证状态值', async () => {
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'invalid-status' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: '无效的状态值',
        validStatuses: ['draft', 'pending', 'processing', 'ready', 'error']
      });
    });

    it('应该接受有效的状态值', async () => {
      const validStatuses = ['draft', 'pending', 'processing', 'ready', 'error'];
      
      for (const status of validStatuses) {
        mockReq = {
          method: 'PUT',
          url: '/api/avatars/test-id',
          headers: { 'user-agent': 'jest-test' },
          body: { status },
          params: { id: 'test-id' }
        };

        await avatarManagementHandler(mockReq as Request, mockRes as Response);

        expect(vi.mocked(mockAxios.patch)).toHaveBeenCalled();
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          data: { id: 'test-id', name: 'Test Avatar' },
          message: '模型状态更新成功'
        });
      }
    });

    it('应该验证版本格式', async () => {
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { version: 'invalid-version' },
        params: { id: 'test-id' }
      };

      // 版本格式验证只是警告，不应该阻止更新
      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(vi.mocked(mockAxios.patch)).toHaveBeenCalled();
    });

    it('应该接受语义化版本号', async () => {
      const validVersions = ['1.0.0', '2.1.3', '10.5.2'];
      
      for (const version of validVersions) {
        mockReq = {
          method: 'PUT',
          url: '/api/avatars/test-id',
          headers: { 'user-agent': 'jest-test' },
          body: { version },
          params: { id: 'test-id' }
        };

        await avatarManagementHandler(mockReq as Request, mockRes as Response);

        expect(vi.mocked(mockAxios.patch)).toHaveBeenCalled();
      }
    });

    it('应该只更新提供的字段', async () => {
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(vi.mocked(mockAxios.patch)).toHaveBeenCalledWith(
        'http://test-directus:8055/items/avatars/test-id',
        { status: 'ready' },
        expect.any(Object)
      );
    });
  });

  describe('PATCH方法 - 部分更新模型信息', () => {
    it('应该成功部分更新模型信息', async () => {
      mockReq = {
        method: 'PATCH',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { name: 'Updated Avatar', description: 'New description' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(vi.mocked(mockAxios.patch)).toHaveBeenCalledWith(
        'http://test-directus:8055/items/avatars/test-id',
        { name: 'Updated Avatar', description: 'New description' },
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 'test-id', name: 'Test Avatar' },
        message: '模型信息更新成功'
      });
    });
  });

  describe('错误处理', () => {
    it('应该在Directus API返回404时返回404错误', async () => {
      vi.mocked(mockAxios.patch).mockRejectedValue({
        response: { status: 404, data: { message: 'Not found' } }
      });

      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: '模型不存在' });
    });

    it('应该在Directus API错误时返回500错误', async () => {
      vi.mocked(mockAxios.patch).mockRejectedValue({
        response: { status: 500, data: { message: 'Internal error' } }
      });

      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: '模型管理操作失败' });
    });

    it('应该在网络错误时返回500错误', async () => {
      vi.mocked(mockAxios.patch).mockRejectedValue(new Error('Network error'));

      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: '模型管理操作失败' });
    });
  });

  describe('日志记录', () => {
    it('应该记录请求开始信息', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('🔧 Avatar Management 请求开始:', {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready' }
      });

      consoleSpy.mockRestore();
    });

    it('应该记录成功更新信息', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockReq = {
        method: 'PUT',
        url: '/api/avatars/test-id',
        headers: { 'user-agent': 'jest-test' },
        body: { status: 'ready', version: '1.0.0' },
        params: { id: 'test-id' }
      };

      await avatarManagementHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('🔄 更新模型状态:', {
        avatarId: 'test-id',
        status: 'ready',
        version: '1.0.0',
        name: undefined,
        description: undefined
      });

      consoleSpy.mockRestore();
    });
  });
});
