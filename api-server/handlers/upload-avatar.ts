import type { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { Logger } from '../utils/logger';
import { AxiosErrorResponse } from '../types/errors.js';

// 上传模型处理器
const uploadAvatarHandler = async (req: Request, res: Response) => {
  Logger.handlerStart('Upload Avatar', req);

  try {
    const directusUrl = process.env.DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_TOKEN;

    if (!directusUrl || !directusToken) {
      Logger.error('Directus 配置缺失');
      return res.status(500).json({ error: 'Directus 配置缺失' });
    }

    // 获取表单数据
    const { name, description, purpose, style, version, tags } = req.body;

    // 验证必填字段
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '模型名称是必填项' });
    }

    // 检查文件上传
    const files = req.files as any;
    if (!files || !files.glbFile) {
      return res.status(400).json({ error: 'GLB模型文件是必填项' });
    }

    const glbFile = Array.isArray(files.glbFile) ? files.glbFile[0] : files.glbFile;
    const previewFile = files.previewFile
      ? Array.isArray(files.previewFile)
        ? files.previewFile[0]
        : files.previewFile
      : null;

    // 调试文件属性
    Logger.info('GLB文件属性详情', {
      name: glbFile.name,
      size: glbFile.size,
      mimetype: glbFile.mimetype,
      tempFilePath: glbFile.tempFilePath,
      data: glbFile.data ? `Buffer of ${glbFile.data.length} bytes` : 'No data buffer',
      truncated: glbFile.truncated,
    });

    if (previewFile) {
      Logger.info('预览文件属性详情', {
        name: previewFile.name,
        size: previewFile.size,
        mimetype: previewFile.mimetype,
        tempFilePath: previewFile.tempFilePath,
        data: previewFile.data ? `Buffer of ${previewFile.data.length} bytes` : 'No data buffer',
        truncated: previewFile.truncated,
      });
    }

    Logger.info('文件上传信息', {
      glbFile: {
        name: glbFile.name,
        size: glbFile.size,
        mimetype: glbFile.mimetype,
      },
      previewFile: previewFile
        ? {
            name: previewFile.name,
            size: previewFile.size,
            mimetype: previewFile.mimetype,
          }
        : null,
    });

    // 验证文件类型
    if (!isValidGlbFile(glbFile)) {
      return res.status(400).json({
        error: '无效的GLB文件格式，请上传.glb或.gltf文件',
      });
    }

    if (previewFile && !isValidImageFile(previewFile)) {
      return res.status(400).json({
        error: '无效的预览图片格式，请上传图片文件',
      });
    }

    let glbFileId: string | null = null;
    let previewFileId: string | null = null;

    try {
      // 1. 上传GLB文件到Directus
      glbFileId = await uploadFileToDirectus(glbFile, directusUrl, directusToken);
      Logger.info('GLB文件上传成功', { fileId: glbFileId });

      // 2. 上传预览图片到Directus（如果有）
      if (previewFile) {
        previewFileId = await uploadFileToDirectus(previewFile, directusUrl, directusToken);
        Logger.info('预览图片上传成功', { fileId: previewFileId });
      }

      // 3. 创建Avatar记录
      const avatarData = {
        name: name.trim(),
        description: description?.trim() || '',
        purpose: purpose || null,
        style: style || null,
        version: version || '1.0.0',
        tags: tags ? JSON.parse(tags) : [],
        glb_file: glbFileId,
        preview: previewFileId,
        status: 'draft', // 新上传的模型默认为草稿状态
      };

      Logger.info('创建Avatar记录', avatarData);

      const response = await axios.post(`${directusUrl}/items/avatars`, avatarData, {
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
      });

      Logger.handlerSuccess('Upload Avatar', {
        avatarId: response.data.data.id,
        glbFileId,
        previewFileId,
      });

      res.status(201).json({
        success: true,
        data: response.data.data,
        message: '模型上传成功',
      });
    } catch (uploadError) {
      // 如果Avatar创建失败，清理已上传的文件
      Logger.error('Avatar创建失败，正在清理文件', uploadError);

      try {
        if (glbFileId) {
          await deleteFileFromDirectus(glbFileId, directusUrl, directusToken);
        }
        if (previewFileId) {
          await deleteFileFromDirectus(previewFileId, directusUrl, directusToken);
        }
      } catch (cleanupError) {
        Logger.error('文件清理失败', cleanupError);
      }

      throw uploadError;
    }
  } catch (error: unknown) {
    const axiosError = error as AxiosErrorResponse;

    Logger.handlerError('Upload Avatar', axiosError, {
      errorType: axiosError.constructor?.name || 'Unknown',
    });

    if (axiosError.response) {
      Logger.error('Directus API 错误', {
        status: axiosError.response.status,
        statusText: axiosError.response.statusText,
        data: JSON.stringify(axiosError.response.data, null, 2),
      });
    }

    res.status(500).json({ error: '模型上传失败' });
  }
};

// 上传文件到Directus
async function uploadFileToDirectus(
  file: any,
  directusUrl: string,
  directusToken: string
): Promise<string> {
  const formData = new FormData();

  // 处理文件数据：如果使用了 tempFiles，读取临时文件；否则使用内存缓冲区
  let fileStream;
  let actualFileSize = file.size;

  if (file.tempFilePath) {
    // 使用临时文件模式
    Logger.info('使用临时文件模式', {
      tempFilePath: file.tempFilePath,
      declaredSize: file.size,
    });

    // 检查临时文件是否存在并获取实际大小
    const stats = fs.statSync(file.tempFilePath);
    actualFileSize = stats.size;

    Logger.info('临时文件统计', {
      actualFileSize,
      declaredSize: file.size,
      exists: fs.existsSync(file.tempFilePath),
    });

    fileStream = fs.createReadStream(file.tempFilePath);
  } else {
    // 使用内存缓冲区模式
    Logger.info('使用内存缓冲区模式', {
      bufferLength: file.data?.length,
    });
    fileStream = file.data;
  }

  formData.append('file', fileStream, {
    filename: file.name,
    contentType: file.mimetype,
    knownLength: actualFileSize,
  });

  Logger.info('上传文件到Directus', {
    fileName: file.name,
    declaredSize: file.size,
    actualSize: actualFileSize,
    mimeType: file.mimetype,
    usingTempFile: !!file.tempFilePath,
  });

  const response = await axios.post(`${directusUrl}/files`, formData, {
    headers: {
      Authorization: `Bearer ${directusToken}`,
      ...formData.getHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  Logger.info('Directus文件上传响应', {
    fileId: response.data.data.id,
    fileName: response.data.data.filename_download,
    fileSize: response.data.data.filesize,
  });

  // 清理临时文件
  if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
    try {
      fs.unlinkSync(file.tempFilePath);
      Logger.info('临时文件已清理', { tempFilePath: file.tempFilePath });
    } catch (error) {
      Logger.warn('清理临时文件失败', { tempFilePath: file.tempFilePath, error });
    }
  }

  return response.data.data.id;
}

// 从Directus删除文件
async function deleteFileFromDirectus(
  fileId: string,
  directusUrl: string,
  directusToken: string
): Promise<void> {
  await axios.delete(`${directusUrl}/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${directusToken}`,
    },
  });
}

// 验证GLB文件
function isValidGlbFile(file: any): boolean {
  const validMimeTypes = [
    'model/gltf-binary',
    'application/octet-stream',
    'application/json', // For .gltf files
  ];
  const validExtensions = ['.glb', '.gltf'];

  return (
    validMimeTypes.includes(file.mimetype) ||
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  );
}

// 验证图片文件
function isValidImageFile(file: any): boolean {
  return file.mimetype.startsWith('image/');
}

export default uploadAvatarHandler;
