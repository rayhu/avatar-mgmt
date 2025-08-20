import { voiceStylesManager } from './voice-styles-manager.js';

export interface SSMLGenerationRequest {
  text: string;
  voice: string;
  model?: string;
}

export interface SSMLGenerationResult {
  ssml: string;
  rawSSML: string;
  tokenUsage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  model?: string;
}

interface OpenAIMessage {
  role: string; // 放松类型约束，允许任何字符串
  content: string;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  model?: string;
}

/**
 * OpenAI SSML 生成器
 * 负责调用 OpenAI API 生成符合 Azure TTS 要求的 SSML 内容
 */
export class OpenAISSMLGenerator {
  private readonly defaultModel = 'gpt-4o';
  private readonly temperature = 0.2;

  constructor() {
    // 确保语音样式配置已加载
    voiceStylesManager.loadFromFile();
  }

  /**
   * 生成 SSML 内容
   */
  async generateSSML(request: SSMLGenerationRequest): Promise<SSMLGenerationResult> {
    const { text, voice, model = this.defaultModel } = request;

    // 获取语音支持的样式
    const allowedStyles = voiceStylesManager.getStylesForVoice(voice);
    const styleList = allowedStyles.join(', ');

    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt(voice, styleList);

    // 构建消息
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Voice: ${voice}\n\nText:\n"""${text.trim()}"""`,
      },
    ];

    // 调用 OpenAI API
    const response = await this.callOpenAIAPI(model, messages);

    // 处理响应
    const rawSSML = response?.choices?.[0]?.message?.content || '';
    const ssml = this.cleanSSML(rawSSML);

    return {
      ssml,
      rawSSML,
      tokenUsage: response?.usage,
      model: response?.model,
    };
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(voice: string, styleList: string): string {
    return `You are an expert speech-synthesis engineer helping me create Azure TTS SSML. Follow **ALL** rules:
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
  }

  /**
   * 调用 OpenAI API
   */
  private async callOpenAIAPI(
    model: string,
    messages: OpenAIMessage[]
  ): Promise<OpenAIResponse | undefined> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const requestBody = {
      model,
      messages,
      temperature: this.temperature,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  }

  /**
   * 清理 SSML 内容，移除 markdown 标记
   */
  private cleanSSML(rawSSML: string): string {
    return rawSSML
      .replace(/^```[\s\S]*?\n/, '') // 移除开头的 markdown 代码块
      .replace(/```$/g, '') // 移除结尾的 markdown 代码块
      .trim();
  }
}

// 导出单例实例
export const openaiSSMLGenerator = new OpenAISSMLGenerator();
