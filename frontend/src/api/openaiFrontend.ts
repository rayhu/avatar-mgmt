const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generateSSMLFront(text: string, voice: string) {
  if (!OPENAI_KEY) throw new Error('VITE_OPENAI_API_KEY not configured');

  const prompt = `你是一名语音合成工程师，请将以下中文文本转换为符合 Azure TTS 的 SSML，要求：\n- 使用 <speak> 根元素及正确的 xmlns。\n- 在 <prosody> 中适当设置 rate=\"medium\" pitch=\"+0Hz\"。\n- 根据语义对长句插入 <break time=\"300ms\"/>。\n- 返回完整 SSML，不要包含多余说明。\n文本：\n\"\"\"${text}\"\"\"`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Convert text to Azure SSML' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  let ssml: string = data.choices?.[0]?.message?.content || '';
  ssml = ssml.replace(/^```[\s\S]*?\n/, '').replace(/```$/g, '').trim();
  return ssml;
} 
