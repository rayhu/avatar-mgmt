const API_BASE = import.meta.env.VITE_API_URL || '';

export async function synthesizeSpeech(
  content: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
  isSSML: boolean = false,
): Promise<Blob> {
  const ssml = isSSML
    ? (() => {
        if (content.includes('mstts:') && !/xmlns:mstts=/.test(content)) {
          return content.replace(
            /<speak([^>]*?)>/i,
            '<speak$1 xmlns:mstts="http://www.w3.org/2001/mstts">',
          );
        }
        return content;
      })()
    : `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="zh-CN"><voice name="${voice}">${content}</voice></speak>`;

  const res = await fetch(`${API_BASE}/api/azure-tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssml }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Azure TTS proxy error: ${res.status} ${msg}`);
  }
  return await res.blob();
}
