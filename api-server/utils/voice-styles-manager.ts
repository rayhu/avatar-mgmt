import * as fs from 'fs';
import * as path from 'path';

/**
 * Azure TTS 语音样式管理器
 * 负责管理各语音支持的情绪标签和样式配置
 */
export class VoiceStylesManager {
  private voiceStyles: Record<string, string[]> = {};
  private isLoaded = false;

  constructor() {
    this.loadDefaultStyles();
  }

  /**
   * 加载默认语音样式配置
   */
  private loadDefaultStyles(): void {
    this.voiceStyles = {
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
  }

  /**
   * 尝试从本地 JSON 文件加载语音样式配置
   */
  async loadFromFile(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const possiblePaths = [
        path.join(process.cwd(), '../frontend', 'public', 'azure-voices-zh.json'),
        path.join(process.cwd(), 'public', 'azure-voices-zh.json'),
        path.join(process.cwd(), 'azure-voices-zh.json'),
        '/app/public/azure-voices-zh.json',
      ];

      let jsonPath: string | null = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          jsonPath = p;
          break;
        }
      }

      if (jsonPath) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const list: { name: string; styles?: string[] }[] = JSON.parse(raw);
        list.forEach(v => {
          this.voiceStyles[v.name] = v.styles ?? [];
        });
        // Logger.info('Loaded voice styles from azure-voices-zh.json');
      } else {
        throw new Error('azure-voices-zh.json not found in any expected location');
      }

      this.isLoaded = true;
    } catch (err) {
      console.warn(
        '[VoiceStylesManager] Failed to load azure-voices-zh.json, fallback to static map.',
        err
      );
    }
  }

  /**
   * 获取指定语音支持的样式列表
   */
  getStylesForVoice(voice: string): string[] {
    return (
      this.voiceStyles[voice] ?? ['cheerful', 'sad', 'angry', 'excited', 'hopeful', 'assistant']
    );
  }

  /**
   * 获取所有语音样式配置
   */
  getAllVoiceStyles(): Record<string, string[]> {
    return { ...this.voiceStyles };
  }

  /**
   * 检查语音是否支持指定样式
   */
  isStyleSupported(voice: string, style: string): boolean {
    const styles = this.getStylesForVoice(voice);
    return styles.includes(style);
  }
}

// 导出单例实例
export const voiceStylesManager = new VoiceStylesManager();
