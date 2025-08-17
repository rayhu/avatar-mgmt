import { Request, Response } from 'express';
import axios from 'axios';
import { Logger } from '../utils/logger';

export async function assetsHandler(req: Request, res: Response) {
  const fileId = req.params.fileId;
  
  if (!fileId) {
    Logger.error('Assets handler: 缺少文件ID', {
      component: 'AssetsHandler',
      method: 'GET',
      error: 'Missing fileId parameter'
    });
    return res.status(400).json({ error: 'Missing fileId parameter' });
  }

  const DIRECTUS_URL = process.env.DIRECTUS_URL;
  const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
  
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    Logger.error('Assets handler: Directus配置缺失', {
      component: 'AssetsHandler',
      method: 'GET',
      fileId,
      error: 'Directus configuration missing'
    });
    return res.status(500).json({ error: 'Directus configuration missing' });
  }

  try {
    Logger.info('Assets handler: 开始获取文件', {
      component: 'AssetsHandler',
      method: 'GET',
      fileId,
      directusUrl: DIRECTUS_URL
    });

    // 通过Directus API获取文件信息
    const fileResponse = await axios.get(`${DIRECTUS_URL}/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!fileResponse.data) {
      Logger.warn('Assets handler: 文件不存在', {
        component: 'AssetsHandler',
        method: 'GET',
        fileId,
        status: fileResponse.status
      });
      return res.status(404).json({ error: 'File not found' });
    }

    const fileData = fileResponse.data.data;
    
    // Directus文件下载URL格式：/assets/{fileId}
    const fileUrl = `/assets/${fileId}`;
    const fullFileUrl = `${DIRECTUS_URL}${fileUrl}`;

    Logger.info('Assets handler: 开始代理文件', {
      component: 'AssetsHandler',
      method: 'GET',
      fileId,
      fileUrl: fullFileUrl,
      fileName: fileData.filename_download || fileData.filename,
      fileSize: fileData.filesize,
      mimeType: fileData.type
    });

    // 代理文件内容
    const fileResponse2 = await axios.get(fullFileUrl, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`
      },
      responseType: 'stream'
    });

    // 设置响应头
    res.set({
      'Content-Type': fileData.type || 'application/octet-stream',
      'Content-Length': fileData.filesize || '',
      'Content-Disposition': `inline; filename="${fileData.filename_download || fileData.filename}"`,
      'Cache-Control': 'public, max-age=31536000', // 缓存1年
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    // 流式传输文件
    fileResponse2.data.pipe(res);

    Logger.info('Assets handler: 文件代理成功', {
      component: 'AssetsHandler',
      method: 'GET',
      fileId,
      fileName: fileData.filename_download || fileData.filename,
      fileSize: fileData.filesize,
      mimeType: fileData.type
    });

  } catch (error: any) {
    Logger.error('Assets handler: 文件代理失败', {
      component: 'AssetsHandler',
      method: 'GET',
      fileId,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    });

    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(500).json({ 
      error: 'Failed to proxy file',
      message: error.response?.data?.message || error.message
    });
  }
}
