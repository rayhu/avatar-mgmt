import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SSMLValidator, SSMLValidationResult } from '../../utils/ssml-validator.js';

describe('SSMLValidator', () => {
  let validator: SSMLValidator;

  beforeEach(() => {
    validator = new SSMLValidator();
  });

  describe('validate', () => {
    it('应该验证有效的 SSML', () => {
      const validSSML = '<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="zh-CN-XiaoxiaoNeural">你好世界</voice></speak>';
      
      const result = validator.validate(validSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // 允许有警告，因为验证器会检查各种情况
      expect(result.fixedSSML).toBeUndefined();
    });

    it('应该检测空的 SSML 内容', () => {
      const emptySSML = '';
      
      const result = validator.validate(emptySSML);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SSML 内容为空');
      // 空内容不会有警告
    });

    it('应该检测缺少 speak 根元素', () => {
      const invalidSSML = '<voice name="zh-CN-XiaoxiaoNeural">测试</voice>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('缺少 <speak> 根元素');
    });

    it('应该检测标签闭合问题', () => {
      const invalidSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural">测试</voice>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('可能存在未闭合的 XML 标签');
    });

    it('应该检测 XML 声明格式问题', () => {
      const invalidSSML = '<?xml version="1.0" encoding="UTF-8"<speak>测试</speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('XML 声明格式可能不正确');
    });

    it('应该检测缺少命名空间', () => {
      const invalidSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural">测试</voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('可能缺少正确的 SSML 命名空间');
    });

    it('应该检测 voice 元素缺少 name 属性', () => {
      const invalidSSML = '<speak><voice>测试</voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('<voice> 元素缺少 name 属性');
    });

    it('应该检测 MSTTS 扩展缺少命名空间', () => {
      const invalidSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural"><mstts:express-as style="cheerful">测试</mstts:express-as></voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('使用了 mstts:express-as 但缺少 mstts 命名空间');
    });

    it('应该检测 MSTTS 扩展缺少 style 属性', () => {
      const invalidSSML = '<speak xmlns:mstts="http://www.w3.org/2001/mstts"><voice name="zh-CN-XiaoxiaoNeural"><mstts:express-as>测试</mstts:express-as></voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('mstts:express-as 缺少 style 属性');
    });

    it('应该自动修复 pitch="0st" 问题', () => {
      const invalidSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="0st">测试</prosody></voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('检测到无效的 pitch="0st"，应该使用 pitch="+0st"');
      expect(result.fixedSSML).toBe('<speak><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="+0st">测试</prosody></voice></speak>');
    });

    it('应该检测缺少 voice 元素', () => {
      const invalidSSML = '<speak>测试内容</speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('SSML 内容中缺少 <voice> 元素，建议添加 voice 元素包装内容');
    });

    it('应该验证语音名称格式', () => {
      const invalidSSML = '<speak><voice name="invalid-voice">测试</voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('语音名称格式可能不正确: invalid-voice');
    });

    it('应该检测缺少版本属性', () => {
      const invalidSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural">测试</voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('建议添加 SSML 版本属性: version="1.0"');
    });

    it('应该检测缺少语言属性', () => {
      const invalidSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural">测试</voice></speak>';
      
      const result = validator.validate(invalidSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('建议添加语言属性: xml:lang="zh-CN"');
    });

    it('应该处理复杂的有效 SSML', () => {
      const complexSSML = `<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">
        <voice name="zh-CN-XiaoxiaoNeural">
          <mstts:express-as style="cheerful" styledegree="2">
            大家好！
          </mstts:express-as>
          <break time="500ms"/>
          <mstts:express-as style="sad" styledegree="1">
            很抱歉让您久等了。
          </mstts:express-as>
        </voice>
      </speak>`;
      
      const result = validator.validate(complexSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // 允许有警告，因为验证器会检查各种情况
    });

    it('应该处理异常情况', () => {
      // 模拟一个会导致异常的情况
      const originalMatch = String.prototype.match;
      String.prototype.match = vi.fn().mockImplementation(() => {
        throw new Error('模拟的异常');
      });

      const result = validator.validate('<speak>测试</speak>');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SSML 验证异常: 模拟的异常');

      // 恢复原始方法
      String.prototype.match = originalMatch;
    });
  });

  describe('边界情况', () => {
    it('应该处理只有空格的 SSML', () => {
      const whitespaceSSML = '   \n\t  ';
      
      const result = validator.validate(whitespaceSSML);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SSML 内容为空');
    });

    it('应该处理自闭合标签', () => {
      const selfClosingSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural"><break time="500ms"/>测试</voice></speak>';
      
      const result = validator.validate(selfClosingSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该处理多个 pitch="0st" 问题', () => {
      const multiplePitchSSML = '<speak><voice name="zh-CN-XiaoxiaoNeural"><prosody pitch="0st">第一段</prosody><prosody pitch="0st">第二段</prosody></voice></speak>';
      
      const result = validator.validate(multiplePitchSSML);
      
      expect(result.isValid).toBe(true);
      expect(result.fixedSSML).toContain('pitch="+0st"');
      expect(result.fixedSSML?.match(/pitch="\+0st"/g)).toHaveLength(2);
    });
  });
});
