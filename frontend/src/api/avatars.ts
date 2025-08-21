import type { Avatar } from '../types/avatar';
import { logger } from '@/utils/logger';
import { buildAssetUrl } from '@/config/api';
import apiClient from './axios';

export async function getAvatars(includeDeleted?: boolean): Promise<Avatar[]> {
  const startTime = Date.now();

  // 检查Window对象上的标志，如果设置了就显示已删除的项目
  const shouldIncludeDeleted = includeDeleted ?? (window as any).__SHOW_DELETED_AVATARS__ ?? false;

  logger.apiCall('Avatars', '/api/avatars', {
    component: 'AvatarsAPI',
    method: 'getAvatars',
    includeDeleted: shouldIncludeDeleted,
  });

  try {
    const response = await apiClient.get('/api/avatars');
    const duration = Date.now() - startTime;

    logger.apiResponse('Avatars', response.status, {
      duration,
      contentType: response.headers['content-type'],
      ok: response.status >= 200 && response.status < 300,
    });

    const rawAvatars = response.data;

    // 为每个avatar构建正确的previewUrl和url
    let avatars: Avatar[] = rawAvatars.map((avatar: any) => ({
      ...avatar,
      url: avatar.glb_file ? buildAssetUrl(avatar.glb_file) : '',
      previewUrl: avatar.preview ? buildAssetUrl(avatar.preview) : undefined,
    }));

    // 如果不包含已删除的项目，则过滤掉状态为'deleted'的项目
    if (!shouldIncludeDeleted) {
      avatars = avatars.filter(avatar => avatar.status !== 'deleted');
    }

    logger.info('获取 avatars 成功', {
      component: 'AvatarsAPI',
      method: 'getAvatars',
      avatarCount: avatars.length,
      totalCount: rawAvatars.length,
      includeDeleted: shouldIncludeDeleted,
      deletedFiltered: !shouldIncludeDeleted ? rawAvatars.length - avatars.length : 0,
      duration,
    });

    return avatars;
  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e as Error;

    logger.apiError('Avatars', error, {
      component: 'AvatarsAPI',
      method: 'getAvatars',
      duration,
    });

    logger.warn('/api/avatars unavailable, throwing error', {
      component: 'AvatarsAPI',
      method: 'getAvatars',
      error: error.message,
    });

    // 抛出错误而不是返回空数组，让调用者决定如何处理
    throw error;
  }
}

export async function uploadAvatar(formData: FormData): Promise<Avatar> {
  const startTime = Date.now();

  logger.apiCall('Avatars', '/api/avatars', {
    component: 'AvatarsAPI',
    method: 'uploadAvatar',
  });

  try {
    const response = await apiClient.post('/api/avatars', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const duration = Date.now() - startTime;

    logger.apiResponse('Avatars', response.status, {
      duration,
      contentType: response.headers['content-type'],
      ok: response.status >= 200 && response.status < 300,
    });

    const result = response.data;
    const avatar = result.data;

    // 构建正确的previewUrl和url
    const processedAvatar: Avatar = {
      ...avatar,
      url: avatar.glb_file ? buildAssetUrl(avatar.glb_file) : '',
      previewUrl: avatar.preview ? buildAssetUrl(avatar.preview) : undefined,
    };

    logger.info('上传 avatar 成功', {
      component: 'AvatarsAPI',
      method: 'uploadAvatar',
      avatarId: avatar.id,
      duration,
    });

    return processedAvatar;
  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e as Error;

    logger.apiError('Avatars', error, {
      component: 'AvatarsAPI',
      method: 'uploadAvatar',
      duration,
    });

    throw error;
  }
}
