import type { Model } from '../types/model';

export async function getModels(): Promise<Model[]> {
  try {
    const res = await fetch('/api/models');
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return await res.json();
    }
    throw new Error('invalid response');
  } catch (e) {
    console.warn('[model] /api/models unavailable, fallback to built-in list');
    return [];
    // return [
    //   { id: 'default', name: 'Default Avatar', file: '/models/default.glb', status: 'ready' },
    // ] as Model[];
  }
}
