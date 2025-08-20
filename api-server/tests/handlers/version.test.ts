import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import versionHandler from '../../handlers/version.js';

// Mock fs 模块
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

// Mock path 模块
vi.mock('path', () => ({
  join: vi.fn(),
  dirname: vi.fn(),
}));

// Mock child_process 模块
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

// Mock url 模块
vi.mock('url', () => ({
  fileURLToPath: vi.fn(),
  dirname: vi.fn(),
}));

// Mock console 方法
let consoleSpy: {
  log: any;
  warn: any;
  error: any;
};

// 导入模拟的模块
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as url from 'url';

const mockFs = fs as any;
const mockPath = path as any;
const mockChildProcess = childProcess as any;
const mockUrl = url as any;

describe('Version Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();

    // 设置console mock
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(),
      warn: vi.spyOn(console, 'warn').mockImplementation(),
      error: vi.spyOn(console, 'error').mockImplementation(),
    };

    // 创建模拟的响应对象
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockRes = {
      status: mockStatus,
      json: mockJson,
    };

    // 设置默认的模拟返回值
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockUrl.fileURLToPath.mockReturnValue('/mock/path/handlers/version.ts');
    mockUrl.dirname.mockReturnValue('/mock/path/handlers');

    // 设置默认的Git信息模拟
    mockChildProcess.execSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse')) {
        return 'abc123'; // commitHash
      } else if (command.includes('branch')) {
        return 'main'; // branch
      } else if (command.includes('log')) {
        return '2025-08-17T08:30:00+00:00'; // commitDate
      }
      return 'unknown';
    });

    // 设置默认的文件系统模拟
    mockFs.promises.readFile.mockResolvedValue(
      JSON.stringify({
        frontend: {
          version: '1.0.0',
          commitHash: 'def456',
          buildTime: '2025-08-17T08:00:00Z',
          branch: 'main',
          commitDate: '2025-08-17T08:00:00Z',
        },
        backend: {
          version: '1.0.0',
          commitHash: 'def456',
          buildTime: '2025-08-17T08:00:00Z',
          branch: 'main',
          commitDate: '2025-08-17T08:00:00Z',
        },
        system: {
          deployTime: '2025-08-17T08:00:00Z',
          environment: 'production',
          uptime: '0s',
          lastCheck: '2025-08-17T08:00:00Z',
        },
        generatedAt: '2025-08-17T08:00:00Z',
      })
    );

    // 设置默认环境变量
    process.env.NODE_ENV = 'development';

    // 模拟 process.uptime
    Object.defineProperty(process, 'uptime', {
      value: vi.fn().mockReturnValue(3600), // 1小时
      writable: true,
    });
  });

  afterEach(() => {
    // 恢复环境变量
    process.env = originalEnv;

    // 恢复console方法
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('HTTP方法验证', () => {
    it('应该接受GET请求', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled(); // 不应该返回错误状态
    });

    it('应该接受POST请求', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });
  });

  describe('开发环境测试', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('应该在开发环境中实时生成版本信息', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          frontend: expect.objectContaining({
            version: 'dev',
            commitHash: 'abc123',
            branch: 'main',
          }),
          backend: expect.objectContaining({
            version: 'dev',
            commitHash: 'abc123',
            branch: 'main',
          }),
          system: expect.objectContaining({
            environment: 'development',
          }),
        })
      );

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Generated real-time version info for development')
      );
    });

    it('应该包含正确的Git信息', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];

      expect(response.frontend.commitHash).toBe('abc123');
      expect(response.frontend.branch).toBe('main');
      expect(response.frontend.commitDate).toBe('2025-08-17T08:30:00+00:00');
      expect(response.backend.commitHash).toBe('abc123');
      expect(response.backend.branch).toBe('main');
      expect(response.backend.commitDate).toBe('2025-08-17T08:30:00+00:00');
    });

    it('应该包含正确的系统信息', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];

      expect(response.system.environment).toBe('development');
      expect(response.system.uptime).toBe('1h 0m 0s');
      expect(response.generatedAt).toBeDefined();
    });
  });

  describe('生产环境测试', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('应该从文件读取版本信息', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockFs.promises.readFile).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Loaded version info from file and updated dynamic data')
      );
    });

    it('应该更新动态信息', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];

      expect(response.system.uptime).toBe('1h 0m 0s');
      expect(response.system.lastCheck).toBeDefined();
      expect(response.system.environment).toBe('production');
    });

    it('应该在文件读取失败时生成默认版本信息', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load version file, generating')
      );

      const response = mockJson.mock.calls[0][0];
      expect(response.frontend.version).toBe('1.0.0');
      expect(response.backend.version).toBe('1.0.0');
      expect(response.system.environment).toBe('production');
    });
  });

  describe('Git信息获取', () => {
    it('应该成功获取Git信息', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      expect(mockChildProcess.execSync).toHaveBeenCalledWith('git rev-parse --short HEAD', {
        encoding: 'utf8',
      });
      expect(mockChildProcess.execSync).toHaveBeenCalledWith('git branch --show-current', {
        encoding: 'utf8',
      });
      expect(mockChildProcess.execSync).toHaveBeenCalledWith('git log -1 --format=%cd --date=iso', {
        encoding: 'utf8',
      });
    });

    it('应该在Git命令失败时使用默认值', async () => {
      // 在开发环境下，Git命令失败会返回默认值
      // 重置Git命令的mock，让它们抛出错误
      mockChildProcess.execSync.mockImplementation(() => {
        throw new Error('Git not found');
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      // 验证使用了默认值（Git命令失败后，getGitInfo会返回unknown）
      const response = mockJson.mock.calls[0][0];
      expect(response.frontend.commitHash).toBe('unknown');
      expect(response.frontend.branch).toBe('unknown');
      expect(response.frontend.commitDate).toBe('unknown');
      expect(response.backend.commitHash).toBe('unknown');
      expect(response.backend.branch).toBe('unknown');
      expect(response.backend.commitDate).toBe('unknown');
    });
  });

  describe('运行时间计算', () => {
    it('应该正确计算小时格式的运行时间', async () => {
      Object.defineProperty(process, 'uptime', {
        value: vi.fn().mockReturnValue(7325), // 2小时2分5秒
        writable: true,
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];
      expect(response.system.uptime).toBe('2h 2m 5s');
    });

    it('应该正确计算分钟格式的运行时间', async () => {
      Object.defineProperty(process, 'uptime', {
        value: vi.fn().mockReturnValue(125), // 2分5秒
        writable: true,
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];
      expect(response.system.uptime).toBe('2m 5s');
    });

    it('应该正确计算秒格式的运行时间', async () => {
      Object.defineProperty(process, 'uptime', {
        value: vi.fn().mockReturnValue(45), // 45秒
        writable: true,
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];
      expect(response.system.uptime).toBe('45s');
    });

    it('应该在uptime计算失败时返回unknown', async () => {
      Object.defineProperty(process, 'uptime', {
        value: vi.fn().mockImplementation(() => {
          throw new Error('Uptime error');
        }),
        writable: true,
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];
      expect(response.system.uptime).toBe('unknown');
    });
  });

  describe('错误处理', () => {
    it('应该在发生错误时返回500状态码', async () => {
      // 模拟一个真正会抛出错误的场景：让Date.toISOString抛出错误
      process.env.NODE_ENV = 'production';

      // 模拟文件读取成功
      mockFs.promises.readFile.mockResolvedValue(
        JSON.stringify({
          frontend: {
            version: '1.0.0',
            commitHash: 'def456',
            buildTime: '2025-08-17T08:00:00Z',
            branch: 'main',
            commitDate: '2025-08-17T08:00:00Z',
          },
          backend: {
            version: '1.0.0',
            commitHash: 'def456',
            buildTime: '2025-08-17T08:00:00Z',
            branch: 'main',
            commitDate: '2025-08-17T08:00:00Z',
          },
          system: {
            deployTime: '2025-08-17T08:00:00Z',
            environment: 'production',
            uptime: '0s',
            lastCheck: '2025-08-17T08:00:00Z',
          },
          generatedAt: '2025-08-17T08:00:00Z',
        })
      );

      // 让Date.toISOString抛出错误
      const originalToISOString = Date.prototype.toISOString;
      Date.prototype.toISOString = vi.fn().mockImplementation(() => {
        throw new Error('Date error');
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      // 恢复原始方法
      Date.prototype.toISOString = originalToISOString;

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to get version info',
        message: 'Date error',
      });
    });

    it('应该记录错误信息', async () => {
      // 模拟Date.toISOString失败
      process.env.NODE_ENV = 'production';

      mockFs.promises.readFile.mockResolvedValue(
        JSON.stringify({
          frontend: {
            version: '1.0.0',
            commitHash: 'def456',
            buildTime: '2025-08-17T08:00:00Z',
            branch: 'main',
            commitDate: '2025-08-17T08:00:00Z',
          },
          backend: {
            version: '1.0.0',
            commitHash: 'def456',
            buildTime: '2025-08-17T08:00:00Z',
            branch: 'main',
            commitDate: '2025-08-17T08:00:00Z',
          },
          system: {
            deployTime: '2025-08-17T08:00:00Z',
            environment: 'production',
            uptime: '0s',
            lastCheck: '2025-08-17T08:00:00Z',
          },
          generatedAt: '2025-08-17T08:00:00Z',
        })
      );

      const originalToISOString = Date.prototype.toISOString;
      Date.prototype.toISOString = vi.fn().mockImplementation(() => {
        throw new Error('Date error');
      });

      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      // 恢复原始方法
      Date.prototype.toISOString = originalToISOString;

      expect(consoleSpy.error).toHaveBeenCalledWith('Version handler error:', expect.any(Error));
    });
  });

  describe('响应格式验证', () => {
    it('应该返回正确的版本信息结构', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/version',
      };

      await versionHandler(mockReq as Request, mockRes as Response);

      const response = mockJson.mock.calls[0][0];

      // 验证结构完整性
      expect(response).toHaveProperty('frontend');
      expect(response).toHaveProperty('backend');
      expect(response).toHaveProperty('system');
      expect(response).toHaveProperty('generatedAt');

      // 验证frontend结构
      expect(response.frontend).toHaveProperty('version');
      expect(response.frontend).toHaveProperty('commitHash');
      expect(response.frontend).toHaveProperty('buildTime');
      expect(response.frontend).toHaveProperty('branch');
      expect(response.frontend).toHaveProperty('commitDate');

      // 验证backend结构
      expect(response.backend).toHaveProperty('version');
      expect(response.backend).toHaveProperty('commitHash');
      expect(response.backend).toHaveProperty('buildTime');
      expect(response.backend).toHaveProperty('branch');
      expect(response.backend).toHaveProperty('commitDate');

      // 验证system结构
      expect(response.system).toHaveProperty('deployTime');
      expect(response.system).toHaveProperty('environment');
      expect(response.system).toHaveProperty('uptime');
      expect(response.system).toHaveProperty('lastCheck');
    });
  });
});
