const ENV_BASE = import.meta.env.VITE_API_URL || '';
const API_BASE = ENV_BASE.replace(/\/$/, ''); // 去掉尾部的 /
const prefix = API_BASE.endsWith('/api') ? '' : '/api';

export async function generateSSMLBackend(text: string, voice: string) {
  const url = `${API_BASE}${prefix}/openai-ssml`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ text, voice, model: 'gpt-4o' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const { ssml } = await res.json();
  return ssml as string;
}
