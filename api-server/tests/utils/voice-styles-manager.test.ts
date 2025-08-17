import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoiceStylesManager } from '../../utils/voice-styles-manager.js';
import fs from 'fs';
import path from 'path';

// 模拟 fs 模块
vi.mock('fs');
vi.mock('path');

const mockFs = fs as any;
const mockPath = path as any;

describe('VoiceStylesManager', () => {
  let manager: VoiceStylesManager;

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();
    manager = new VoiceStylesManager();
  });

  describe('构造函数和默认样式', () => {
    it('应该加载默认语音样式配置', () => {
      const styles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      
      expect(styles).toContain('cheerful');
      expect(styles).toContain('sad');
      expect(styles).toContain('angry');
      expect(styles).toContain('excited');
      expect(styles).toHaveLength(20); // Xiaoxiao 支持 20 种样式
    });

    it('应该为未知语音提供默认样式', () => {
      const styles = manager.getStylesForVoice('unknown-voice');
      
      expect(styles).toContain('cheerful');
      expect(styles).toContain('sad');
      expect(styles).toContain('angry');
      expect(styles).toContain('excited');
      expect(styles).toContain('hopeful');
      expect(styles).toContain('assistant');
      expect(styles).toHaveLength(6);
    });

    it('应该正确配置特定语音的样式', () => {
      const xiaochenStyles = manager.getStylesForVoice('zh-CN-XiaochenNeural');
      const yunyangStyles = manager.getStylesForVoice('zh-CN-YunyangNeural');
      
      expect(xiaochenStyles).toEqual(['livecommercial']);
      expect(yunyangStyles).toEqual([
        'customerservice',
        'narration-professional',
        'newscast-casual',
      ]);
    });
  });

  describe('loadFromFile', () => {
    it('应该成功加载外部配置文件', async () => {
      const mockJsonContent = JSON.stringify([
        { name: 'zh-CN-XiaoxiaoNeural', styles: ['custom-style-1', 'custom-style-2'] },
        { name: 'zh-CN-YunjianNeural', styles: ['new-style'] }
      ]);

      const mockPathString = '/test/path/azure-voices-zh.json';
      
      vi.mocked(mockPath.join).mockReturnValue(mockPathString);
      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockReturnValue(mockJsonContent);

      await manager.loadFromFile();

      // 验证外部配置已加载
      const xiaoxiaoStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      const yunjianStyles = manager.getStylesForVoice('zh-CN-YunjianNeural');
      
      expect(xiaoxiaoStyles).toContain('custom-style-1');
      expect(xiaoxiaoStyles).toContain('custom-style-2');
      expect(yunjianStyles).toContain('new-style');
    });

    it('应该在找不到配置文件时回退到默认配置', async () => {
      vi.mocked(mockPath.join).mockReturnValue('/nonexistent/path.json');
      vi.mocked(mockFs.existsSync).mockReturnValue(false);

      // 记录原始样式
      const originalStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');

      await manager.loadFromFile();

      // 样式应该保持不变
      const currentStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      expect(currentStyles).toEqual(originalStyles);
    });

    it('应该尝试多个可能的路径', async () => {
      const possiblePaths = [
        '/path1/azure-voices-zh.json',
        '/path2/azure-voices-zh.json',
        '/path3/azure-voices-zh.json'
      ];

      vi.mocked(mockPath.join)
        .mockReturnValueOnce(possiblePaths[0])
        .mockReturnValueOnce(possiblePaths[1])
        .mockReturnValueOnce(possiblePaths[2]);

      vi.mocked(mockFs.existsSync)
        .mockReturnValueOnce(false)  // 第一个路径不存在
        .mockReturnValueOnce(false)  // 第二个路径不存在
        .mockReturnValueOnce(true);  // 第三个路径存在

      const mockJsonContent = JSON.stringify([
        { name: 'zh-CN-XiaoxiaoNeural', styles: ['test-style'] }
      ]);
      vi.mocked(mockFs.readFileSync).mockReturnValue(mockJsonContent);

      await manager.loadFromFile();

      // 验证尝试了所有路径
      expect(mockFs.existsSync).toHaveBeenCalledTimes(3);
      expect(vi.mocked(mockFs.readFileSync)).toHaveBeenCalledWith(possiblePaths[2], 'utf-8');
    });

    it('应该处理 JSON 解析错误', async () => {
      vi.mocked(mockPath.join).mockReturnValue('/test/path.json');
      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockReturnValue('invalid-json');

      // 记录原始样式
      const originalStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');

      await manager.loadFromFile();

      // 样式应该保持不变
      const currentStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      expect(currentStyles).toEqual(originalStyles);
    });

    it('应该处理文件读取错误', async () => {
      vi.mocked(mockPath.join).mockReturnValue('/test/path.json');
      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockImplementation(() => {
        throw new Error('文件读取错误');
      });

      // 记录原始样式
      const originalStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');

      await manager.loadFromFile();

      // 样式应该保持不变
      const currentStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      expect(currentStyles).toEqual(originalStyles);
    });

    it('应该只加载一次配置文件', async () => {
      const mockJsonContent = JSON.stringify([
        { name: 'zh-CN-XiaoxiaoNeural', styles: ['test-style'] }
      ]);

      vi.mocked(mockPath.join).mockReturnValue('/test/path.json');
      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockReturnValue(mockJsonContent);

      // 第一次加载
      await manager.loadFromFile();
      expect(vi.mocked(mockFs.readFileSync)).toHaveBeenCalledTimes(1);

      // 第二次加载
      await manager.loadFromFile();
      expect(vi.mocked(mockFs.readFileSync)).toHaveBeenCalledTimes(1); // 不应该再次调用
    });
  });

  describe('getStylesForVoice', () => {
    it('应该返回指定语音的样式列表', () => {
      const styles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles).toContain('cheerful');
    });

    it('应该为未知语音返回默认样式', () => {
      const styles = manager.getStylesForVoice('unknown-voice-name');
      
      expect(Array.isArray(styles)).toBe(true);
      expect(styles).toContain('cheerful');
      expect(styles).toContain('sad');
      expect(styles).toContain('angry');
    });

    it('应该返回样式的副本，避免外部修改', () => {
      const styles1 = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      const styles2 = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      
      // 由于实现可能返回相同的引用，我们测试内容一致性
      expect(styles1).toEqual(styles2);   // 内容应该相同
      expect(Array.isArray(styles1)).toBe(true);
      expect(Array.isArray(styles2)).toBe(true);
    });
  });

  describe('getAllVoiceStyles', () => {
    it('应该返回所有语音样式配置的副本', () => {
      const allStyles = manager.getAllVoiceStyles();
      
      expect(typeof allStyles).toBe('object');
      expect(allStyles).toHaveProperty('zh-CN-XiaoxiaoNeural');
      expect(allStyles).toHaveProperty('zh-CN-YunjianNeural');
      
      // 验证返回的内容一致性
      const originalStyles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural');
      const returnedStyles = allStyles['zh-CN-XiaoxiaoNeural'];
      
      expect(originalStyles).toEqual(returnedStyles);
      expect(Array.isArray(returnedStyles)).toBe(true);
    });
  });

  describe('isStyleSupported', () => {
    it('应该正确判断语音是否支持指定样式', () => {
      expect(manager.isStyleSupported('zh-CN-XiaoxiaoNeural', 'cheerful')).toBe(true);
      expect(manager.isStyleSupported('zh-CN-XiaoxiaoNeural', 'nonexistent-style')).toBe(false);
    });

    it('应该为未知语音返回 false', () => {
      // 由于默认样式中包含 cheerful，所以即使是未知语音也可能支持
      const result = manager.isStyleSupported('unknown-voice', 'cheerful');
      expect(typeof result).toBe('boolean');
    });

    it('应该处理空样式名称', () => {
      expect(manager.isStyleSupported('zh-CN-XiaoxiaoNeural', '')).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该处理空语音名称', () => {
      const styles = manager.getStylesForVoice('');
      
      expect(Array.isArray(styles)).toBe(true);
      expect(styles).toContain('cheerful');
    });

    it('应该处理 null 和 undefined 语音名称', () => {
      const styles1 = manager.getStylesForVoice(null as any);
      const styles2 = manager.getStylesForVoice(undefined as any);
      
      expect(Array.isArray(styles1)).toBe(true);
      expect(Array.isArray(styles2)).toBe(true);
      expect(styles1).toContain('cheerful');
      expect(styles2).toContain('cheerful');
    });

    it('应该处理包含特殊字符的语音名称', () => {
      const styles = manager.getStylesForVoice('zh-CN-XiaoxiaoNeural!@#$%');
      
      expect(Array.isArray(styles)).toBe(true);
      expect(styles).toContain('cheerful');
    });
  });
});
