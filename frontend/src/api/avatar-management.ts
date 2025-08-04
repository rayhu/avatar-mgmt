import type { Avatar } from '../types/avatar';
import { logger } from '@/utils/logger';
import { getApiUrl } from '@/config/api';

// 更新模型状态
export async function updateAvatarStatus(
  id: string, 
  updates: {
    status?: string;
    version?: string;
    name?: string;
    description?: string;
  }
): Promise<Avatar> {
  const startTime = Date.now();
  const url = `${getApiUrl('avatars').replace('/api/avatars', `/api/avatars/${id}`)}`;
  
  logger.apiCall('UpdateAvatarStatus', url, {
    component: 'AvatarManagementAPI',
    method: 'updateAvatarStatus',
    avatarId: id,
    updates
  });
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const duration = Date.now() - startTime;
    
    logger.apiResponse('UpdateAvatarStatus', res.status, {
      duration,
      contentType: res.headers.get('content-type'),
      ok: res.ok
    });
    
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const result = await res.json();
      
      logger.info('更新模型状态成功', {
        component: 'AvatarManagementAPI',
        method: 'updateAvatarStatus',
        avatarId: id,
        updates,
        duration
      });
      
      return result.data;
    }
    
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e as Error;
    
    logger.apiError('UpdateAvatarStatus', error, {
      component: 'AvatarManagementAPI',
      method: 'updateAvatarStatus',
      avatarId: id,
      updates,
      duration
    });
    
    throw error;
  }
}

// 部分更新模型信息
export async function patchAvatarInfo(
  id: string, 
  updates: Partial<Avatar>
): Promise<Avatar> {
  const startTime = Date.now();
  const url = `${getApiUrl('avatars').replace('/api/avatars', `/api/avatars/${id}`)}`;
  
  logger.apiCall('PatchAvatarInfo', url, {
    component: 'AvatarManagementAPI',
    method: 'patchAvatarInfo',
    avatarId: id,
    updates
  });
  
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const duration = Date.now() - startTime;
    
    logger.apiResponse('PatchAvatarInfo', res.status, {
      duration,
      contentType: res.headers.get('content-type'),
      ok: res.ok
    });
    
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const result = await res.json();
      
      logger.info('部分更新模型信息成功', {
        component: 'AvatarManagementAPI',
        method: 'patchAvatarInfo',
        avatarId: id,
        updates,
        duration
      });
      
      return result.data;
    }
    
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  } catch (e) {
    const duration = Date.now() - startTime;
    const error = e as Error;
    
    logger.apiError('PatchAvatarInfo', error, {
      component: 'AvatarManagementAPI',
      method: 'patchAvatarInfo',
      avatarId: id,
      updates,
      duration
    });
    
    throw error;
  }
}

// 批量更新模型状态
export async function batchUpdateAvatarStatus(
  ids: string[], 
  status: string
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };
  
  logger.info('批量更新模型状态开始', {
    component: 'AvatarManagementAPI',
    method: 'batchUpdateAvatarStatus',
    ids,
    status,
    count: ids.length
  });
  
  // 并发更新所有模型
  const promises = ids.map(async (id) => {
    try {
      await updateAvatarStatus(id, { status });
      results.success.push(id);
      return { id, success: true };
    } catch (error) {
      results.failed.push(id);
      logger.warn('批量更新中的单个模型失败', {
        component: 'AvatarManagementAPI',
        method: 'batchUpdateAvatarStatus',
        avatarId: id,
        error: (error as Error).message
      });
      return { id, success: false, error };
    }
  });
  
  await Promise.allSettled(promises);
  
  logger.info('批量更新模型状态完成', {
    component: 'AvatarManagementAPI',
    method: 'batchUpdateAvatarStatus',
    totalCount: ids.length,
    successCount: results.success.length,
    failedCount: results.failed.length,
    results
  });
  
  return results;
}

// 获取模型版本历史（如果需要的话）
export async function getAvatarVersionHistory(id: string): Promise<any[]> {
  // 这里可以实现版本历史记录功能
  // 暂时返回空数组
  logger.info('获取模型版本历史', {
    component: 'AvatarManagementAPI',
    method: 'getAvatarVersionHistory',
    avatarId: id,
    note: '功能待实现'
  });
  
  return [];
}
