/**
 * SSML 验证器
 * 负责验证和修复 SSML 内容，确保其符合 Azure TTS 的要求
 */

export interface SSMLValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedSSML?: string; // 修复后的 SSML 内容
}

export class SSMLValidator {
  /**
   * 验证 SSML 内容
   */
  validate(ssml: string): SSMLValidationResult {
    const result: SSMLValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    let fixedSSML = ssml;

    try {
      // 基本结构验证
      this.validateBasicStructure(ssml, result);

      // XML 格式验证
      this.validateXMLFormat(ssml, result);

      // SSML 特定元素验证
      this.validateSSMLElements(ssml, result);

      // 前端验证逻辑
      fixedSSML = this.applyFrontendValidationLogic(ssml, result);

      // 如果有修复，则添加到结果中
      if (fixedSSML !== ssml) {
        result.fixedSSML = fixedSSML;
      }
    } catch (error) {
      result.errors.push(`SSML 验证异常: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * 验证 SSML 的基本结构
   */
  private validateBasicStructure(ssml: string, result: SSMLValidationResult): void {
    if (!ssml.trim()) {
      result.errors.push('SSML 内容为空');
      result.isValid = false;
      return;
    }

    if (!ssml.includes('<speak')) {
      result.errors.push('缺少 <speak> 根元素');
      result.isValid = false;
    }
  }

  /**
   * 验证 XML 格式
   */
  private validateXMLFormat(ssml: string, result: SSMLValidationResult): void {
    // 检查 XML 声明
    if (ssml.includes('<?xml') && !ssml.match(/^<\?xml.*?\?>/)) {
      result.warnings.push('XML 声明格式可能不正确');
    }

    // 检查标签闭合性
    this.validateTagClosure(ssml, result);

    // 检查特殊字符转义
    this.validateCharacterEscaping(ssml, result);
  }

  /**
   * 验证标签闭合性
   */
  private validateTagClosure(ssml: string, result: SSMLValidationResult): void {
    const openTags = ssml.match(/<[^/][^>]*>/g) || [];
    const closeTags = ssml.match(/<\/[^>]+>/g) || [];
    const selfClosingTags = ssml.match(/<[^>]+\/>/g) || [];

    if (openTags.length !== closeTags.length + selfClosingTags.length) {
      result.errors.push('可能存在未闭合的 XML 标签');
      result.isValid = false;
    }
  }

  /**
   * 验证特殊字符转义
   */
  private validateCharacterEscaping(ssml: string, result: SSMLValidationResult): void {
    const unescapedChars = ssml.match(/[&<>]/g);
    if (unescapedChars) {
      const shouldBeEscaped = unescapedChars.filter(char => {
        return !ssml.includes(`${char === '&' ? '&amp;' : char === '<' ? '&lt;' : '&gt;'}`);
      });
      if (shouldBeEscaped.length > 0) {
        result.warnings.push('可能存在未转义的特殊字符: ' + shouldBeEscaped.join(', '));
      }
    }
  }

  /**
   * 验证 SSML 特定元素
   */
  private validateSSMLElements(ssml: string, result: SSMLValidationResult): void {
    // 检查命名空间
    if (!ssml.includes('xmlns="http://www.w3.org/2001/10/synthesis"')) {
      result.warnings.push('可能缺少正确的 SSML 命名空间');
    }

    // 检查 voice 元素
    this.validateVoiceElement(ssml, result);

    // 检查 mstts 扩展
    this.validateMSTTSExtension(ssml, result);
  }

  /**
   * 验证 voice 元素
   */
  private validateVoiceElement(ssml: string, result: SSMLValidationResult): void {
    if (ssml.includes('<voice') && !ssml.includes('name=')) {
      result.warnings.push('<voice> 元素缺少 name 属性');
    }
  }

  /**
   * 验证 MSTTS 扩展
   */
  private validateMSTTSExtension(ssml: string, result: SSMLValidationResult): void {
    if (ssml.includes('mstts:express-as')) {
      if (!ssml.includes('xmlns:mstts="http://www.w3.org/2001/mstts"')) {
        result.errors.push('使用了 mstts:express-as 但缺少 mstts 命名空间');
        result.isValid = false;
      }

      // 检查 style 属性
      const expressAsMatches = ssml.match(/<mstts:express-as[^>]*>/g) || [];
      for (const match of expressAsMatches) {
        if (!match.includes('style=')) {
          result.warnings.push('mstts:express-as 缺少 style 属性');
        }
      }
    }
  }

  /**
   * 应用前端验证逻辑
   */
  private applyFrontendValidationLogic(ssml: string, result: SSMLValidationResult): string {
    let fixedSSML = ssml;

    // 检查 pitch="0st" 问题
    fixedSSML = this.fixPitchValue(fixedSSML, result);

    // 检查 voice 元素存在性
    this.validateVoiceElementExistence(fixedSSML, result);

    // 检查 voice 元素 name 属性格式
    this.validateVoiceNameFormat(fixedSSML, result);

    // 检查 SSML 标准属性
    this.validateStandardAttributes(fixedSSML, result);

    return fixedSSML;
  }

  /**
   * 修复 pitch="0st" 问题
   */
  private fixPitchValue(ssml: string, result: SSMLValidationResult): string {
    if (ssml.includes('pitch="0st"')) {
      result.warnings.push('检测到无效的 pitch="0st"，应该使用 pitch="+0st"');
      return ssml.replace(/pitch="0st"/g, 'pitch="+0st"');
    }
    return ssml;
  }

  /**
   * 验证 voice 元素存在性
   */
  private validateVoiceElementExistence(ssml: string, result: SSMLValidationResult): void {
    const innerContent = ssml
      .replace(/<speak[\s\S]*?>/, '')
      .replace(/<\/speak>/, '')
      .trim();

    const hasVoiceElement = /<voice[\s>]/i.test(innerContent);
    if (!hasVoiceElement) {
      result.warnings.push('SSML 内容中缺少 <voice> 元素，建议添加 voice 元素包装内容');
    }
  }

  /**
   * 验证 voice 元素 name 属性格式
   */
  private validateVoiceNameFormat(ssml: string, result: SSMLValidationResult): void {
    const voiceMatches = ssml.match(/<voice[^>]*name=["']([^"']+)["']/gi);
    if (voiceMatches) {
      for (const match of voiceMatches) {
        const nameMatch = match.match(/name=["']([^"']+)["']/i);
        if (nameMatch && nameMatch[1]) {
          const voiceName = nameMatch[1];
          // 检查是否是有效的 Azure TTS 语音名称格式
          if (!/^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/i.test(voiceName)) {
            result.warnings.push(`语音名称格式可能不正确: ${voiceName}`);
          }
        }
      }
    }
  }

  /**
   * 验证 SSML 标准属性
   */
  private validateStandardAttributes(ssml: string, result: SSMLValidationResult): void {
    if (!ssml.includes('version="1.0"')) {
      result.warnings.push('建议添加 SSML 版本属性: version="1.0"');
    }

    if (!ssml.includes('xml:lang=')) {
      result.warnings.push('建议添加语言属性: xml:lang="zh-CN"');
    }
  }
}

// 导出单例实例
export const ssmlValidator = new SSMLValidator();
