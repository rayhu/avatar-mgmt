import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { assetsHandler } from '../../handlers/assets.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Import mocked modules
import axios from 'axios';

// Mock Logger
vi.mock('../utils/logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Assets Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;
  let mockPipe: ReturnType<typeof vi.fn>;
  const originalEnv = process.env;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockSet = vi.fn();
    mockPipe = vi.fn();

    mockReq = {
      params: { fileId: 'test-file-id' },
    };

    mockRes = {
      status: mockStatus,
      json: mockJson,
      set: mockSet,
      pipe: mockPipe,
    };

    // Setup environment variables
    process.env.DIRECTUS_URL = 'http://localhost:8055';
    process.env.DIRECTUS_TOKEN = 'test-token';

    // Reset all mocks
    vi.clearAllMocks();

    // Ensure environment variables are set after clearing mocks
    process.env.DIRECTUS_URL = 'http://localhost:8055';
    process.env.DIRECTUS_TOKEN = 'test-token';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('应该返回400错误当缺少fileId参数', async () => {
    mockReq.params = {};

    await assetsHandler(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Missing fileId parameter' });
  });

  it('应该返回500错误当Directus配置缺失', async () => {
    delete process.env.DIRECTUS_URL;
    delete process.env.DIRECTUS_TOKEN;

    await assetsHandler(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Directus configuration missing' });
  });

  it('应该成功代理文件', async () => {
    // 确保环境变量设置正确
    process.env.DIRECTUS_URL = 'http://localhost:8055';
    process.env.DIRECTUS_TOKEN = 'test-token';

    const mockFileData = {
      data: {
        data: {
          id: 'test-file-id',
          filename_download: 'test.jpg',
          filesize: 1024,
          type: 'image/jpeg',
        },
      },
    };

    const mockFileStream = {
      data: {
        pipe: mockPipe,
      },
    };

    vi.mocked(axios.get)
      .mockResolvedValueOnce(mockFileData) // 第一次调用获取文件信息
      .mockResolvedValueOnce(mockFileStream); // 第二次调用获取文件内容

    await assetsHandler(mockReq as Request, mockRes as Response);

    expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith({
      'Content-Type': 'image/jpeg',
      'Content-Length': 1024,
      'Content-Disposition': 'inline; filename="test.jpg"',
      'Cache-Control': 'public, max-age=31536000',
    });
    expect(mockPipe).toHaveBeenCalledWith(mockRes);
  });

  it('应该处理文件不存在的情况', async () => {
    // 确保环境变量设置正确
    process.env.DIRECTUS_URL = 'http://localhost:8055';
    process.env.DIRECTUS_TOKEN = 'test-token';

    vi.mocked(axios.get).mockRejectedValueOnce({
      response: { status: 404, data: { message: 'File not found' } },
    });

    await assetsHandler(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: 'File not found' });
  });

  it('应该处理其他错误', async () => {
    // 确保环境变量设置正确
    process.env.DIRECTUS_URL = 'http://localhost:8055';
    process.env.DIRECTUS_TOKEN = 'test-token';

    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    await assetsHandler(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Failed to proxy file',
      message: 'Network error',
    });
  });
});
