import type { Request, Response } from 'express';
import axios from 'axios';
import { Logger } from '../utils/logger';
 
// 注意：previewUrl 现在由前端根据环境配置构建

const avatarHandler = async (req: Request, res: Response) => {
  Logger.handlerStart('Avatars', req);

  try {
    const directusUrl = process.env.DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_TOKEN;

    Logger.info('配置检查', {
      directusUrl: directusUrl ? '已配置' : '未配置',
      directusToken: directusToken ? '已配置' : '未配置',
      nodeEnv: process.env.NODE_ENV
    });

    if (!directusUrl || !directusToken) {
      Logger.error('Directus 配置缺失');
      return res.status(500).json({ error: 'Directus 配置缺失' });
    }

    Logger.apiCall('Directus', `${directusUrl}/items/avatars`, {
      tokenLength: directusToken.length
    });

    const response = await axios.get(`${directusUrl}/items/avatars`, {
      headers: {
        Authorization: `Bearer ${directusToken}`,
      },
    });

    Logger.apiResponse('Directus', response.status, {
      statusText: response.statusText,
      dataCount: response.data?.data?.length || 0
    });

    // 只返回原始数据，让前端根据环境构建URL
    const avatars = response.data.data || [];

    Logger.handlerSuccess('Avatars', {
      avatarCount: avatars.length
    });

    res.json(avatars);
  } catch (error: any) {
    Logger.handlerError('Avatars', error, {
      errorType: error.constructor.name
    });
    
    // 检查是否是网络错误
    if (error.code === 'ECONNREFUSED') {
      Logger.error('网络连接错误: Directus 服务器无法访问');
    } else if (error.response) {
      Logger.error('Directus API 错误', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data, null, 2)
      });
    }
    
    res.status(500).json({ error: '查询avatars内容失败' });
  }
};

export default avatarHandler;
