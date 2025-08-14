import { Request, Response } from 'express';
import versionHandler from '../../handlers/version.js';
import fs from 'fs';
import path from 'path';

// 模拟 fs 模块
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// 模拟 path 模块
jest.mock('path');
const mockPath = path as jest.Mocked<typeof path>;

describe('Version Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置环境变量
    process.env.NODE_ENV = 'test';
    process.env.GIT_COMMIT_HASH = 'test123';
    process.env.GIT_BRANCH = 'test-branch';
    process.env.BUILD_TIME = '2024-01-01T00:00:00Z';
    
    // 创建模拟的响应对象
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // 设置默认的模拟返回值
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockFs.existsSync.mockReturnValue(false);
  });

  afterEach(() => {
    // 清理环境变量
    delete process.env.NODE_ENV;
    delete process.env.GIT_COMMIT_HASH;
    delete process.env.GIT_BRANCH;
    delete process.env.BUILD_TIME;
  });

  describe('GET /api/version', () => {
    it('应该返回默认版本信息当版本文件不存在时', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
        headers: { 'user-agent': 'jest-test' }
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          frontend: expect.objectContaining({
            version: expect.stringContaining('test123'),
            commitHash: 'test123',
            branch: 'test-branch'
          }),
          backend: expect.objectContaining({
            version: expect.stringContaining('test123'),
            commitHash: 'test123',
            branch: 'test-branch'
          }),
          system: expect.objectContaining({
            environment: 'test'
          })
        })
      );
    });

    it('应该从版本文件读取版本信息', async () => {
      // 模拟版本文件存在
      mockFs.existsSync.mockImplementation((path: string) => {
        return path.includes('full.json');
      });
      
      const mockVersionData = {
        frontend: {
          version: '1.0.0',
          commitHash: 'abc123',
          buildTime: '2024-01-01T00:00:00Z',
          branch: 'main',
          commitDate: '2024-01-01T00:00:00Z'
        },
        backend: {
          version: '1.0.0',
          commitHash: 'abc123',
          buildTime: '2024-01-01T00:00:00Z',
          branch: 'main',
          commitDate: '2024-01-01T00:00:00Z'
        },
        system: {
          deployTime: '2024-01-01T00:00:00Z',
          environment: 'production',
          uptime: '0s'
        },
        generatedAt: '2024-01-01T00:00:00Z'
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockVersionData));

      mockReq = {
        method: 'GET',
        url: '/api/version',
        headers: { 'user-agent': 'jest-test' }
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          frontend: mockVersionData.frontend,
          backend: mockVersionData.backend,
          system: expect.objectContaining({
            ...mockVersionData.system,
            uptime: expect.any(String),
            lastCheck: expect.any(String)
          }),
          api: expect.objectContaining({
            endpoint: '/api/version',
            timestamp: expect.any(String),
            uptime: expect.any(String)
          })
        })
      );
    });

    it('应该在读取版本文件失败时返回默认信息', async () => {
      // 模拟版本文件存在但读取失败
      mockFs.existsSync.mockImplementation((path: string) => {
        return path.includes('full.json');
      });
      
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
        headers: { 'user-agent': 'jest-test' }
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          frontend: expect.objectContaining({
            version: expect.stringContaining('test123')
          }),
          backend: expect.objectContaining({
            version: expect.stringContaining('test123')
          })
        })
      );
    });

    it('应该包含API信息', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
        headers: { 'user-agent': 'jest-test' }
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          api: expect.objectContaining({
            endpoint: '/api/version',
            timestamp: expect.any(String),
            uptime: expect.any(String)
          })
        })
      );
    });

    it('应该在发生错误时返回500状态', async () => {
      // 模拟fs.existsSync抛出错误
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('FS error');
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
        headers: { 'user-agent': 'jest-test' }
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to get version information',
        message: 'FS error',
        timestamp: expect.any(String)
      });
    });
  });
});
