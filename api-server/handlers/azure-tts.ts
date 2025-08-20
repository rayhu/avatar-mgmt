import type { Request, Response } from 'express';
import { debugLogger } from '../utils/debug-logger.js';
import { ssmlValidator } from '../utils/ssml-validator.js';

// POST /api/azure-tts
// Body: { ssml: string, voice?: string }
// Returns: binary audio (mp3)
// Requires env vars: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION

export default async function handler(req: Request, res: Response) {
  debugLogger.clearLogs();
  debugLogger.info('AZURE-TTS', '请求开始', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    debugMode: debugLogger.isDebugEnabled(),
  });

  if (req.method !== 'POST') {
    debugLogger.error('AZURE-TTS', '方法不允许', { method: req.method });
    return res.status(405).json({
      error: 'Method not allowed',
      debugLogs: debugLogger.getLogsForResponse(),
    });
  }

  try {
    const { ssml, voice = 'zh-CN-XiaoxiaoNeural' } = req.body as { ssml?: string; voice?: string };

    debugLogger.info('AZURE-TTS', '请求参数解析', {
      voice,
      ssmlLength: ssml?.length || 0,
      ssmlPreview:
        typeof ssml === 'string'
          ? ssml.slice(0, 200) + (ssml.length > 200 ? '...' : '')
          : String(ssml),
      hasSSML: !!ssml,
    });

    if (!ssml || typeof ssml !== 'string' || (typeof ssml === 'string' && !ssml.trim())) {
      debugLogger.error('AZURE-TTS', 'SSML 参数无效', {
        ssml,
        type: typeof ssml,
        isEmpty: typeof ssml === 'string' ? !ssml.trim() : true,
      });
      return res.status(400).json({
        error: 'Parameter "ssml" is required.',
        debugLogs: debugLogger.getLogsForResponse(),
      });
    }

    // 详细验证 SSML
    const validationResult = ssmlValidator.validate(ssml);
    if (!validationResult.isValid) {
      debugLogger.error('AZURE-TTS', 'SSML 验证失败', {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        ssml: ssml,
      });
      return res.status(400).json({
        error: 'Invalid SSML format',
        details: validationResult.errors,
        warnings: validationResult.warnings,
        debugLogs: debugLogger.getLogsForResponse(),
      });
    }

    if (validationResult.warnings.length > 0) {
      debugLogger.warn('AZURE-TTS', 'SSML 验证警告', {
        warnings: validationResult.warnings,
      });
    }

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      debugLogger.error('AZURE-TTS', 'Azure 凭据未配置', {
        hasKey: !!key,
        hasRegion: !!region,
        keyLength: key?.length || 0,
      });
      return res.status(500).json({
        error: 'Azure Speech credentials are not configured.',
        debugLogs: debugLogger.getLogsForResponse(),
      });
    }

    debugLogger.info('AZURE-TTS', '准备调用 Azure TTS API', {
      region,
      voice,
      keyLength: key.length,
      ssmlLength: ssml.length,
      endpoint: `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    });

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const requestHeaders = {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-MICROSOFT-OUTPUTFORMAT': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'avatar-mgmt-v1',
    };

    debugLogger.debug('AZURE-TTS', '发送请求到 Azure API', {
      url,
      headers: { ...requestHeaders, 'Ocp-Apim-Subscription-Key': '[REDACTED]' },
      bodyLength: ssml.length,
      bodyStart: ssml.substring(0, 300),
    });

    const azureRes = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: ssml,
    });

    const responseHeaders = Object.fromEntries(azureRes.headers.entries());
    debugLogger.info('AZURE-TTS', 'Azure API 响应', {
      status: azureRes.status,
      statusText: azureRes.statusText,
      ok: azureRes.ok,
      headers: responseHeaders,
      contentType: azureRes.headers.get('content-type'),
      contentLength: azureRes.headers.get('content-length'),
    });

    if (!azureRes.ok) {
      const errTxt = await azureRes.text();
      debugLogger.error('AZURE-TTS', 'Azure TTS API 请求失败', {
        status: azureRes.status,
        statusText: azureRes.statusText,
        errorBody: errTxt,
        headers: responseHeaders,
        requestSSML: ssml,
        voice: voice,
      });

      // 尝试解析 Azure 错误详情
      let azureErrorDetail = null;
      try {
        azureErrorDetail = JSON.parse(errTxt);
      } catch {
        azureErrorDetail = errTxt;
      }

      return res.status(azureRes.status).json({
        error: 'Azure TTS request failed',
        details: azureErrorDetail,
        requestInfo: {
          voice,
          ssmlLength: ssml.length,
          region,
        },
        debugLogs: debugLogger.getLogsForResponse(),
      });
    }

    const arrayBuffer = await azureRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    debugLogger.info('AZURE-TTS', '音频生成成功', {
      bufferSize: buffer.length,
      audioSizeKB: (buffer.length / 1024).toFixed(2),
      audioSizeMB: (buffer.length / (1024 * 1024)).toFixed(3),
      contentType: azureRes.headers.get('content-type'),
      durationEstimate: `~${(buffer.length / 16000).toFixed(1)}s`, // 粗略估算
    });

    // 如果是调试模式，在响应头中添加调试信息
    if (debugLogger.isDebugEnabled()) {
      res.setHeader(
        'X-Debug-Info',
        JSON.stringify({
          ssmlLength: ssml.length,
          voice: voice,
          region: region,
          audioSize: buffer.length,
        })
      );
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600');

    debugLogger.info('AZURE-TTS', '请求处理完成', {
      success: true,
      responseSize: buffer.length,
      processingComplete: true,
    });

    return res.status(200).send(buffer);
  } catch (error: unknown) {
    const axiosError = error as {
      message?: string;
      constructor?: { name: string };
      stack?: string;
    };

    debugLogger.error('AZURE-TTS', 'Handler 内部错误', {
      error: axiosError.message,
      errorType: axiosError.constructor?.name || 'Unknown',
      stack: axiosError.stack,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      error: 'Internal server error',
      details: axiosError.message,
      timestamp: new Date().toISOString(),
      debugLogs: debugLogger.getLogsForResponse(),
    });
  }
}
