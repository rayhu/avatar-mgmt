import type { Avatar } from '../types/avatar';
import { logger } from '@/utils/logger';
import { getApiUrl } from '@/config/api';

export async function getAvatars(): Promise<Avatar[]> {
  const startTime = Date.now();
  const url = getApiUrl('avatars');
  
  logger.apiCall('Avatars', url, {
    component: 'AvatarsAPI',
    method: 'getAvatars'
  });
  
  try {
    const res = await fetch(url);
    const duration = Date.now() - startTime;
    
    logger.apiResponse('Avatars', res.status, {
      duration,
      contentType: res.headers.get('content-type'),
      ok: res.ok
    });
    
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const avatars = await res.json();
      logger.info('获取 avatars 成功', {
        component: 'AvatarsAPI',
        method: 'getAvatars',
        avatarCount: avatars.length,
        duration
      });
      return avatars;
    }
    
    throw new Error('invalid response');
  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e as Error;
    
    logger.apiError('Avatars', error, {
      component: 'AvatarsAPI',
      method: 'getAvatars',
      duration
    });
    
    logger.warn(`${url} unavailable, returning empty array`, {
      component: 'AvatarsAPI',
      method: 'getAvatars',
      error: error.message
    });
    
    return [];
  }
}
