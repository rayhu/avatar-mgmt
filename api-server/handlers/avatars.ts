import type { Request, Response } from 'express';
import axios from 'axios';
 
// 注意：previewUrl 现在由前端根据环境配置构建

const avatarHandler = async (req: Request, res: Response) => {
  console.log('🖼️ Avatars 请求开始:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query
  });

  try {
    const directusUrl = process.env.DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_TOKEN;

    console.log('📋 配置检查:', {
      directusUrl: directusUrl ? '已配置' : '未配置',
      directusToken: directusToken ? '已配置' : '未配置',
      nodeEnv: process.env.NODE_ENV
    });

    if (!directusUrl || !directusToken) {
      console.log('❌ Directus 配置缺失');
      return res.status(500).json({ error: 'Directus 配置缺失' });
    }

    console.log('🌐 调用 Directus API:', {
      url: `${directusUrl}/items/avatars`,
      tokenLength: directusToken.length
    });

    const response = await axios.get(`${directusUrl}/items/avatars`, {
      headers: {
        Authorization: `Bearer ${directusToken}`,
      },
    });

    console.log('📥 Directus 响应:', {
      status: response.status,
      statusText: response.statusText,
      dataCount: response.data?.data?.length || 0
    });

    // 只返回原始数据，让前端根据环境构建URL
    const avatars = response.data.data || [];

    console.log('✅ Avatars 查询成功:', {
      avatarCount: avatars.length
    });

    res.json(avatars);
  } catch (error: any) {
    console.error('❌ Avatars handler 错误:', {
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack
    });
    
    // 检查是否是网络错误
    if (error.code === 'ECONNREFUSED') {
      console.error('🌐 网络连接错误: Directus 服务器无法访问');
    } else if (error.response) {
      console.error('📥 Directus API 错误:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data, null, 2)
      });
    }
    
    res.status(500).json({ error: '查询avatars内容失败' });
  }
};

export default avatarHandler;
