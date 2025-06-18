import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Azure TTS 各 voice 支持的情绪标签（精简示例，可按需补充）
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
  'zh-CN-XiaozhenNeural': [
    'angry',
    'cheerful',
    'disgruntled',
    'fearful',
    'sad',
    'serious',
  ],
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
  'zh-CN-YunyangNeural': [
    'customerservice',
    'narration-professional',
    'newscast-casual',
  ],
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

// 尝试从本地 JSON 文件加载 voice → styles 映射，成功后覆盖默认 VOICE_STYLES
try {
  const jsonPath = path.join(process.cwd(), 'frontend', 'public', 'azure-voices-zh.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const list: { name: string; styles?: string[] }[] = JSON.parse(raw);
  list.forEach((v) => {
    VOICE_STYLES[v.name] = v.styles ?? [];
  });
  // eslint-disable-next-line no-console
  console.log('[openai-ssml] Loaded voice styles from azure-voices-zh.json');
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[openai-ssml] Failed to load azure-voices-zh.json, fallback to static map.', err);
}

// POST /api/openai-ssml
// Body: { text: string; voice?: string; model?: string }
// Returns: { ssml: string }
// The OpenAI API key is expected in the environment variable OPENAI_API_KEY.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'zh-CN-XiaoxiaoNeural', model = 'gpt-4o' } = req.body as {
      text?: string;
      voice?: string;
      model?: string;
    };

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Parameter "text" is required.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
    }

    // 根据当前 voice 取支持的情绪列表，若未知则使用通用集合
    const allowedStyles = VOICE_STYLES[voice] ?? [
      'cheerful',
      'sad',
      'angry',
      'excited',
      'hopeful',
      'assistant',
    ];

    const styleList = allowedStyles.join(', ');

    const systemPrompt = `You are an expert speech-synthesis engineer helping me create Azure TTS SSML. Follow **ALL** rules:
1. Use the <speak> root element with xmlns="http://www.w3.org/2001/10/synthesis" and xmlns:mstts="http://www.w3.org/2001/mstts".
2. Wrap the whole content in exactly ONE <voice name="${voice}"> tag.
3. Analyse the meaning and sentiment of the text and apply Azure style via <mstts:express-as>:
   • Allowed styles for ${voice}: ${styleList}.
   • Use exactly one style per sentence or split sentences to enhance contrast.
   • ALWAYS include styledegree="1" or "2" (use 2 for strong emotions like angry or excited).
   • If no strong emotion detected, default to cheerful with styledegree="1".
4. Combine with <prosody> (rate/pitch) and <emphasis> to reinforce emotion;
   e.g. sad → pitch="-2st" rate="slow", excited → pitch="+3st" rate="fast".
5. Insert <break time="500ms"/> between sentences when emotion changes.
6. Return ONLY valid SSML XML—NO markdown, code fences, or explanations.

Example:
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">
  <voice name="${voice}">
    <mstts:express-as style="cheerful" styledegree="2">
      大家好！
    </mstts:express-as>
    <break time="500ms"/>
    <mstts:express-as style="sad" styledegree="1">
      很抱歉让您久等了。
    </mstts:express-as>
  </voice>
</speak>`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Voice: ${voice}\n\nText:\n"""${text.trim()}"""`,
      },
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return res.status(500).json({ error: 'OpenAI request failed', details: errorText });
    }

    const data = (await openaiResponse.json()) as any;
    let ssml: string = data?.choices?.[0]?.message?.content || '';

    // Remove possible markdown fences
    ssml = ssml.replace(/^```[\s\S]*?\n/, '').replace(/```$/g, '').trim();

    return res.status(200).json({ ssml });
  } catch (error: any) {
    console.error('openai-ssml handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
