import type { Avatar } from '../types/avatar';
import { logger } from '@/utils/logger';
import { buildAssetUrl } from '@/config/api';
import apiClient from './axios';

export async function getAvatars(): Promise<Avatar[]> {
  const startTime = Date.now();

  logger.apiCall('Avatars', '/api/avatars', {
    component: 'AvatarsAPI',
    method: 'getAvatars',
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

    // 为每个avatar构建正确的previewUrl
    const avatars: Avatar[] = rawAvatars.map((avatar: any) => ({
      ...avatar,
      previewUrl: avatar.preview ? buildAssetUrl(avatar.preview) : undefined,
    }));

    logger.info('获取 avatars 成功', {
      component: 'AvatarsAPI',
      method: 'getAvatars',
      avatarCount: avatars.length,
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

    logger.warn('/api/avatars unavailable, returning empty array', {
      component: 'AvatarsAPI',
      method: 'getAvatars',
      error: error.message,
    });

    return [];
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

    // 构建正确的previewUrl
    const processedAvatar: Avatar = {
      ...avatar,
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
