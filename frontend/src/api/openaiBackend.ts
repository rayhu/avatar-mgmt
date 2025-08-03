import { getApiUrl } from '@/config/api';

export async function generateSSMLBackend(text: string, voice: string) {
  const url = getApiUrl('openaiSSML');
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ text, voice, model: 'gpt-4o' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const { ssml } = await res.json();
  return ssml as string;
}
