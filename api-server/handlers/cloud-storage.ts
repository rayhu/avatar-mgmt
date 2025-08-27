import { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import { SimpleCloudStorageManager } from '../utils/simple-cloud-storage';

export class CloudStorageHandler {
  private storageManager: SimpleCloudStorageManager;

  constructor() {
    this.storageManager = new SimpleCloudStorageManager();
  }

  /**
   * 生成文件的signed URL
   * GET /api/cloud-storage/signed-url/:fileId
   */
  async generateSignedUrl(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      const { expiresIn = 3600 } = req.query; // 默认1小时过期

      if (!fileId) {
        return res.status(400).json({
          error: 'Missing fileId parameter',
          code: 'MISSING_FILE_ID',
        });
      }

      Logger.info('Generating signed URL for file', {
        component: 'CloudStorageHandler',
        method: 'generateSignedUrl',
        fileId,
        expiresIn,
      });

      // 验证用户权限（这里可以添加你的权限验证逻辑）
      const hasPermission = await this.verifyFilePermission(req, fileId);
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      // 生成signed URL
      const signedUrl = await this.storageManager.generateSignedUrl(
        fileId,
        parseInt(expiresIn as string)
      );

      Logger.info('Signed URL generated successfully', {
        component: 'CloudStorageHandler',
        method: 'generateSignedUrl',
        fileId,
        expiresIn: expiresIn,
      });

      res.json({
        success: true,
        data: {
          signedUrl,
          expiresIn: parseInt(expiresIn as string),
          expiresAt: new Date(Date.now() + parseInt(expiresIn as string) * 1000).toISOString(),
        },
      });
    } catch (error) {
      Logger.error('Failed to generate signed URL', {
        component: 'CloudStorageHandler',
        method: 'generateSignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Failed to generate signed URL',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * 上传文件到云存储
   * POST /api/cloud-storage/upload
   */
  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          code: 'NO_FILE',
        });
      }

      const file = req.files.file as any;
      const { category = 'avatars', metadata = {} } = req.body;

      Logger.info('Uploading file to cloud storage', {
        component: 'CloudStorageHandler',
        method: 'uploadFile',
        fileName: file.name,
        fileSize: file.size,
        category,
      });

      // 验证文件类型和大小
      const validationResult = await this.validateFile(file);
      if (!validationResult.valid) {
        return res.status(400).json({
          error: validationResult.error,
          code: 'FILE_VALIDATION_FAILED',
        });
      }

      // 上传到云存储
      const uploadResult = await this.storageManager.uploadFile(file, category, metadata);

      Logger.info('File uploaded successfully', {
        component: 'CloudStorageHandler',
        method: 'uploadFile',
        fileId: uploadResult.fileId,
        fileName: file.name,
      });

      res.json({
        success: true,
        data: uploadResult,
      });
    } catch (error) {
      Logger.error('Failed to upload file', {
        component: 'CloudStorageHandler',
        method: 'uploadFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Failed to upload file',
        code: 'UPLOAD_FAILED',
      });
    }
  }

  /**
   * 删除云存储中的文件
   * DELETE /api/cloud-storage/:fileId
   */
  async deleteFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          error: 'Missing fileId parameter',
          code: 'MISSING_FILE_ID',
        });
      }

      Logger.info('Deleting file from cloud storage', {
        component: 'CloudStorageHandler',
        method: 'deleteFile',
        fileId,
      });

      // 验证用户权限
      const hasPermission = await this.verifyFilePermission(req, fileId);
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      // 删除文件
      await this.storageManager.deleteFile(fileId);

      Logger.info('File deleted successfully', {
        component: 'CloudStorageHandler',
        method: 'deleteFile',
        fileId,
      });

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      Logger.error('Failed to delete file', {
        component: 'CloudStorageHandler',
        method: 'deleteFile',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Failed to delete file',
        code: 'DELETE_FAILED',
      });
    }
  }

  /**
   * 获取文件信息
   * GET /api/cloud-storage/:fileId/info
   */
  async getFileInfo(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          error: 'Missing fileId parameter',
          code: 'MISSING_FILE_ID',
        });
      }

      Logger.info('Getting file info', {
        component: 'CloudStorageHandler',
        method: 'getFileInfo',
        fileId,
      });

      // 验证用户权限
      const hasPermission = await this.verifyFilePermission(req, fileId);
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      // 获取文件信息
      const fileInfo = await this.storageManager.getFileInfo(fileId);

      res.json({
        success: true,
        data: fileInfo,
      });
    } catch (error) {
      Logger.error('Failed to get file info', {
        component: 'CloudStorageHandler',
        method: 'getFileInfo',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Failed to get file info',
        code: 'INFO_RETRIEVAL_FAILED',
      });
    }
  }

  /**
   * 验证用户对文件的访问权限
   */
  private async verifyFilePermission(req: Request, fileId: string): Promise<boolean> {
    // TODO: 实现你的权限验证逻辑
    // 这里可以检查用户是否有权限访问特定文件
    // 例如：检查文件是否属于用户，或者用户是否有管理员权限等

    // 临时返回true，你需要根据你的业务逻辑来实现
    return true;
  }

  /**
   * 验证上传的文件
   */
  private async validateFile(file: any): Promise<{ valid: boolean; error?: string }> {
    // 检查文件大小（例如：最大100MB）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
      };
    }

    // 检查文件类型
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'model/gltf-binary',
      'model/gltf+json',
      'application/octet-stream', // 用于.glb文件
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed`,
      };
    }

    return { valid: true };
  }
}

// 导出实例
export const cloudStorageHandler = new CloudStorageHandler();
