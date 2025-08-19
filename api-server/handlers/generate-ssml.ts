import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

// 支持的情绪标签映射（与前端保持一致）
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

// 从 JSON 文件加载 voice → styles 映射
let voiceStyleMap: Record<string, string[]> | null = null;
function loadVoiceStyleMap(): Record<string, string[]> {
  if (voiceStyleMap) return voiceStyleMap;

  try {
    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(process.cwd(), '../frontend', 'public', 'azure-voices-zh.json'),
      path.join(process.cwd(), 'public', 'azure-voices-zh.json'),
      path.join(process.cwd(), 'azure-voices-zh.json'),
      '/app/public/azure-voices-zh.json',
    ];

    let jsonPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        jsonPath = p;
        break;
      }
    }

    if (jsonPath) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const list: { name: string; styles?: string[] }[] = JSON.parse(raw);
      voiceStyleMap = {};
      list.forEach(v => {
        voiceStyleMap![v.name] = v.styles ?? [];
      });
      Logger.info('Loaded voice styles from azure-voices-zh.json');
    } else {
      throw new Error('azure-voices-zh.json not found in any expected location');
    }
  } catch (err) {
    Logger.warn('Failed to load azure-voices-zh.json, fallback to static map', {
      error: err.message,
    });
    voiceStyleMap = VOICE_STYLES;
  }

  return voiceStyleMap;
}

// 重置缓存，用于测试目的
export function resetVoiceStyleMapCache() {
  voiceStyleMap = null;
}

// POST /api/generate-ssml
// Body: { text: string, voice?: string }
// Returns: { ssml: string }
// Requires env var: OPENAI_API_KEY

export default async function handler(req: Request, res: Response) {
  Logger.handlerStart('SSML 生成', req);

  if (req.method !== 'POST') {
    Logger.warn('方法不允许', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'zh-CN-XiaoxiaoNeural' } = req.body as {
      text?: string;
      voice?: string;
    };

    Logger.info('请求参数', {
      text: typeof text === 'string' ? text.slice(0, 50) + (text.length > 50 ? '...' : '') : text,
      voice,
      textLength: typeof text === 'string' ? text.length : 0,
    });

    if (!text || typeof text !== 'string' || !text.trim()) {
      Logger.warn('文本参数无效');
      return res.status(400).json({ error: 'Parameter "text" is required.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      Logger.error('OpenAI API 密钥未配置');
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
    }

    Logger.info('调用 OpenAI API 生成 SSML');

    // 获取 voice 支持的情绪列表
    const stylesMap = loadVoiceStyleMap();
    const allowedStyles = (stylesMap[voice] && stylesMap[voice].length
      ? stylesMap[voice]
      : VOICE_STYLES[voice]) ?? ['cheerful', 'sad', 'angry', 'excited', 'hopeful', 'assistant'];

    const styleList = allowedStyles.join('、');

    const prompt = `你是一名语音合成工程师，请将以下中文文本转换为符合 Azure TTS 的 SSML，要求：
  - 使用 <speak> 根元素，声明 version="1.0"、xmlns="http://www.w3.org/2001/10/synthesis" 和 xml:lang="zh-CN"。
  - 使用唯一的 <voice name="${voice}"> 包裹全部正文。
  - 仅可使用以下情绪标签（style）：${styleList}。
  - 只输出最终 SSML XML，禁止附加说明或 Markdown 代码块。
  - 为每句话选择一个 style；若需对比度强，可拆分句子并混用不同 style。
  - 必须添加 styledegree="1" 或 "2"（愤怒、激动等强烈情绪用 2）。
  - 若情绪不明显，则默认 style="cheerful" 且 styledegree="1"。
  - 可结合 <prosody> (rate/pitch) 与 <emphasis> 提升表现力；示例：sad → pitch="-2st" rate="slow"；excited → pitch="+3st" rate="fast"。但是 0st 是无效的，请使用 +0st 代替。
  - 不同情绪之间插入 <break time="500ms"/>。
  - 只输出最终 SSML XML，禁止附加说明或 Markdown 代码块。

  文本：
  """${text.trim()}"""`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
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

    Logger.apiResponse('OpenAI', openaiResponse.status, {
      statusText: openaiResponse.statusText,
      ok: openaiResponse.ok,
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      Logger.error('OpenAI 请求失败', { error: errorText });
      return res.status(500).json({ error: 'OpenAI request failed', details: errorText });
    }

    const data = (await openaiResponse.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    let ssml: string = data?.choices?.[0]?.message?.content || '';

    // 移除可能的 markdown 代码块
    ssml = ssml
      .replace(/^```[\s\S]*?\n/, '')
      .replace(/```$/g, '')
      .trim();

    Logger.handlerSuccess('SSML 生成', {
      ssmlLength: ssml.length,
      ssmlPreview: ssml.slice(0, 100) + (ssml.length > 100 ? '...' : ''),
    });

    return res.status(200).json({ ssml });
  } catch (error: unknown) {
    const axiosError = error as { message?: string };
    Logger.handlerError('SSML 生成', axiosError);
    return res.status(500).json({ error: 'Internal server error', details: axiosError.message });
  }
}
