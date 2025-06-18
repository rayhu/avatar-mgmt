import { Request, Response } from 'express';
import axios from 'axios';

const avatarHandler = async (req: Request, res: Response) => {
  try {
    const directusUrl = process.env.DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_TOKEN;

    if (!directusUrl || !directusToken) {
      return res.status(500).json({ error: 'Directus 配置缺失' });
    }

    const response = await axios.get(`${directusUrl}/items/avatars`, {
      headers: {
        Authorization: `Bearer ${directusToken}`,
      },
    });

    // 动态获取当前访问的域名

    let BASE_URL =
      process.env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : 'http://localhost:5173';
    // BASE_URL = `${req.protocol}://${req.get('host')}`;
    // 假设每个 avatar 有 file 字段存储文件 id
    const avatars = (response.data.data || []).map((avatar: any) => ({
      ...avatar,
      previewUrl: avatar.preview ? `${BASE_URL}/assets/${avatar.preview}` : undefined,
    }));

    res.json(avatars);
  } catch (error) {
    console.error('查询 Directus 失败:', error);
    res.status(500).json({ error: '查询avatars内容失败' });
  }
};

export default avatarHandler;
