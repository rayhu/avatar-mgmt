const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generateSSMLFront(text: string, voice: string) {
  if (!OPENAI_KEY) throw new Error('VITE_OPENAI_API_KEY not configured');

  const prompt = `你是一名语音合成工程师，请将以下中文文本转换为符合 Azure TTS 的 SSML，要求：
  - 使用 <speak> 根元素，声明 xmlns="http://www.w3.org/2001/10/synthesis" 和 xmlns:mstts="http://www.w3.org/2001/mstts"。
  - 使用唯一的 <voice name="${voice}"> 包裹全部正文。
  - 先分析文本所表达的情绪（开心、悲伤、愤怒、激动、希望……），再用 <mstts:express-as style="…"> 包裹对应句子或整段。
  - 若情绪不明显，则默认使用 cheerful，保持 ENFJ 风格（积极、鼓励）。
  - 可结合 <prosody>、<emphasis> 提升表现力；rate="medium"，pitch 范围±2st。pitch 如果是0，写成 +0st 不要写 0st。
  - 合理位置插入 <break time="300ms"/>。
  - 只输出最终 SSML XML，禁止附加说明或 Markdown 代码块。

  文本：
  """${text}"""`;

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
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  let ssml: string = data.choices?.[0]?.message?.content || '';
  ssml = ssml
    .replace(/^```[\s\S]*?\n/, '')
    .replace(/```$/g, '')
    .trim();
  return ssml;
}
