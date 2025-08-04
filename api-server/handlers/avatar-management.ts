import type { Request, Response } from 'express';
import axios from 'axios';

// 模型状态管理 API
const avatarManagementHandler = async (req: Request, res: Response) => {
  console.log('🔧 Avatar Management 请求开始:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  try {
    const directusUrl = process.env.DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_TOKEN;

    if (!directusUrl || !directusToken) {
      console.log('❌ Directus 配置缺失');
      return res.status(500).json({ error: 'Directus 配置缺失' });
    }

    const { method } = req;
    const avatarId = req.params.id;

    switch (method) {
      case 'PUT':
        // 更新模型状态和版本
        return await updateAvatarStatus(req, res, directusUrl, directusToken, avatarId);
      
      case 'PATCH':
        // 部分更新模型信息
        return await patchAvatarInfo(req, res, directusUrl, directusToken, avatarId);
      
      default:
        return res.status(405).json({ error: '不支持的HTTP方法' });
    }
  } catch (error: any) {
    console.error('❌ Avatar Management handler 错误:', {
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack
    });
    
    res.status(500).json({ error: '模型管理操作失败' });
  }
};

// 更新模型状态
async function updateAvatarStatus(
  req: Request, 
  res: Response, 
  directusUrl: string, 
  directusToken: string, 
  avatarId: string
) {
  const { status, version, name, description } = req.body;

  // 验证状态值
  const validStatuses = ['draft', 'pending', 'processing', 'ready', 'error'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: '无效的状态值', 
      validStatuses 
    });
  }

  // 验证版本格式（可选）
  if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
    console.warn('版本号格式建议使用语义化版本（如 1.0.0）:', version);
  }

  console.log('🔄 更新模型状态:', {
    avatarId,
    status,
    version,
    name,
    description
  });

  try {
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (version !== undefined) updateData.version = version;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const response = await axios.patch(
      `${directusUrl}/items/avatars/${avatarId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ 模型状态更新成功:', {
      avatarId,
      updatedFields: Object.keys(updateData),
      status: response.status
    });

    res.json({
      success: true,
      data: response.data.data,
      message: '模型状态更新成功'
    });
  } catch (error: any) {
    console.error('❌ 更新模型状态失败:', {
      avatarId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 404) {
      return res.status(404).json({ error: '模型不存在' });
    }

    throw error;
  }
}

// 部分更新模型信息
async function patchAvatarInfo(
  req: Request, 
  res: Response, 
  directusUrl: string, 
  directusToken: string, 
  avatarId: string
) {
  const updateData = req.body;

  console.log('🔄 部分更新模型信息:', {
    avatarId,
    fields: Object.keys(updateData)
  });

  try {
    const response = await axios.patch(
      `${directusUrl}/items/avatars/${avatarId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ 模型信息更新成功:', {
      avatarId,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: response.data.data,
      message: '模型信息更新成功'
    });
  } catch (error: any) {
    console.error('❌ 更新模型信息失败:', {
      avatarId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 404) {
      return res.status(404).json({ error: '模型不存在' });
    }

    throw error;
  }
}

export default avatarManagementHandler;
