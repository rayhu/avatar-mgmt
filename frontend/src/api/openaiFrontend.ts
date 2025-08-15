const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// 支持的情绪标签映射（与后端保持一致，示例值）
const VOICE_STYLES: Record<string, string[]> = {
  'zh-CN-XiaochenNeural': ['livecommercial'],
  'zh-CN-XiaohanNeural': [
    'affectionate',
    'angry',
    'calm',
    'cheerful',
    'disgruntled',
    'embarrassed',
    'fearful',
    'gentle',
    'sad',
    'serious',
  ],
  'zh-CN-XiaomengNeural': ['chat'],
  'zh-CN-XiaomoNeural': [
    'affectionate',
    'angry',
    'calm',
    'cheerful',
    'depressed',
    'disgruntled',
    'embarrassed',
    'envious',
    'fearful',
    'gentle',
    'sad',
    'serious',
  ],
  'zh-CN-XiaoruiNeural': ['angry', 'calm', 'fearful', 'sad'],
  'zh-CN-XiaoshuangNeural': ['chat'],
  'zh-CN-XiaoxiaoMultilingualNeural': [
    'affectionate',
    'cheerful',
    'empathetic',
    'excited',
    'poetry-reading',
    'sorry',
    'story',
  ],
  'zh-CN-XiaoxiaoNeural': [
    'affectionate',
    'angry',
    'assistant',
    'calm',
    'chat',
    'chat-casual',
    'cheerful',
    'customerservice',
    'disgruntled',
    'excited',
    'fearful',
    'friendly',
    'gentle',
    'lyrical',
    'newscast',
    'poetry-reading',
    'sad',
    'serious',
    'sorry',
    'whispering',
  ],
  'zh-CN-XiaoyiNeural': [
    'affectionate',
    'angry',
    'cheerful',
    'disgruntled',
    'embarrassed',
    'fearful',
    'gentle',
    'sad',
    'serious',
  ],
  'zh-CN-XiaozhenNeural': ['angry', 'cheerful', 'disgruntled', 'fearful', 'sad', 'serious'],
  'zh-CN-YunfengNeural': [
    'angry',
    'cheerful',
    'depressed',
    'disgruntled',
    'fearful',
    'sad',
    'serious',
  ],
  'zh-CN-YunhaoNeural2': ['advertisement-upbeat'],
  'zh-CN-YunjianNeural': [
    'angry',
    'cheerful',
    'depressed',
    'disgruntled',
    'documentary-narration',
    'narration-relaxed',
    'sad',
    'serious',
    'sports-commentary',
    'sports-commentary-excited',
  ],
  'zh-CN-YunxiaNeural': ['angry', 'calm', 'cheerful', 'fearful', 'sad'],
  'zh-CN-YunxiNeural': [
    'angry',
    'assistant',
    'chat',
    'cheerful',
    'depressed',
    'disgruntled',
    'embarrassed',
    'fearful',
    'narration-relaxed',
    'newscast',
    'sad',
    'serious',
  ],
  'zh-CN-YunyangNeural': ['customerservice', 'narration-professional', 'newscast-casual'],
  'zh-CN-YunyeNeural': [
    'angry',
    'calm',
    'cheerful',
    'disgruntled',
    'embarrassed',
    'fearful',
    'sad',
    'serious',
  ],
  'zh-CN-YunzeNeural': [
    'angry',
    'calm',
    'cheerful',
    'depressed',
    'disgruntled',
    'documentary-narration',
    'fearful',
    'sad',
    'serious',
  ],
};

// 从 public/azure-voices-zh.json 动态加载 voice → styles 映射（首次调用后缓存）
let voiceStyleMapPromise: Promise<Record<string, string[]>> | null = null;
async function getVoiceStyleMap(): Promise<Record<string, string[]>> {
  if (voiceStyleMapPromise) return voiceStyleMapPromise;
  voiceStyleMapPromise = fetch('/azure-voices-zh.json')
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list: { name: string; styles?: string[] }[] = await res.json();
      const map: Record<string, string[]> = {};
      list.forEach((v) => {
        map[v.name] = v.styles ?? [];
      });
      return map;
    })
    .catch((err) => {
      console.warn('[openaiFrontend] Failed to load azure-voices-zh.json:', err);
      return {} as Record<string, string[]>;
    });
  return voiceStyleMapPromise;
}

export async function generateSSMLFront(text: string, voice: string) {
  if (!OPENAI_KEY) throw new Error('VITE_OPENAI_API_KEY not configured');

  // 优先使用 JSON 中的映射，其次回退到内置 VOICE_STYLES，再退到默认集合
  const stylesMap = await getVoiceStyleMap();
  const allowedStyles = (stylesMap[voice] && stylesMap[voice].length
    ? stylesMap[voice]
    : VOICE_STYLES[voice]) ?? ['cheerful', 'sad', 'angry', 'excited', 'hopeful', 'assistant'];

  const styleList = allowedStyles.join('、');

  const prompt = `你是一名语音合成工程师，请将以下中文文本转换为符合 Azure TTS 的 SSML，要求：
  - 使用 <speak> 根元素，声明 xmlns="http://www.w3.org/2001/10/synthesis" 和 xmlns:mstts="http://www.w3.org/2001/mstts"。
  - 使用唯一的 <voice name="${voice}"> 包裹全部正文。
  - 仅可使用以下情绪标签（style）：${styleList}。
  - 为每句话选择一个 style；若需对比度强，可拆分句子并混用不同 style。
  - 必须添加 styledegree="1" 或 "2"（愤怒、激动等强烈情绪用 2）。
  - 若情绪不明显，则默认 style="cheerful" 且 styledegree="1"。
  - 可结合 <prosody> (rate/pitch) 与 <emphasis> 提升表现力；示例：sad → pitch="-2st" rate="slow"；excited → pitch="+3st" rate="fast"。
  - 不同情绪之间插入 <break time="500ms"/>。
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
  
  // 修复 pitch="0st" 问题 - 0st 是无效的，需要转换为 +0st
  ssml = ssml.replace(/pitch="0st"/g, 'pitch="+0st"');
  
  return ssml;
}
