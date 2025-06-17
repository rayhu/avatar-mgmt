export async function generateSSML(text: string, voice: string) {
  const prompt = `
你是一名语音合成工程师，请将以下中文文本转换为符合 Azure TTS 的 SSML，要求：
- 使用 <speak> 根元素及正确的 xmlns。
- 在 <prosody> 中适当设置 rate="medium" pitch="+0Hz"。
- 根据语义对长句插入 <break time="300ms"/>。
- 返回完整 SSML，不要包含多余说明。
文本：
"""${text}"""
`;
  const res = await fetch('/api/openai-ssml', {
    method: 'POST',
    body: JSON.stringify({ prompt, model: 'gpt-4o' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const { ssml } = await res.json();
  return ssml as string;
}
