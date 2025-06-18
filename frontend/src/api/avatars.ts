import type { Avatar } from '../types/avatar';

export async function getAvatars(): Promise<Avatar[]> {
  try {
    const res = await fetch('/api/avatars');
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return await res.json();
    }
    throw new Error('invalid response');
  } catch (e) {
    console.warn('[avatars] /api/avatars unavailable:', e);
    return [];
  }
}
