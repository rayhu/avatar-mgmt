import type { Request, Response } from 'express';

// POST /api/azure-tts
// Body: { ssml: string, voice?: string }
// Returns: binary audio (mp3)
// Requires env vars: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION

export default async function handler(req: Request, res: Response) {
  console.log('🔊 Azure TTS 请求开始:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });

  if (req.method !== 'POST') {
    console.log('❌ 方法不允许:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ssml, voice = 'zh-CN-XiaoxiaoNeural' } = req.body as { ssml?: string; voice?: string };

    console.log('📝 请求参数:', {
      voice,
      ssmlLength: ssml?.length || 0,
      ssmlPreview: ssml?.slice(0, 100) + (ssml && ssml.length > 100 ? '...' : '')
    });

    if (!ssml || typeof ssml !== 'string' || !ssml.trim()) {
      console.log('❌ SSML 参数无效');
      return res.status(400).json({ error: 'Parameter "ssml" is required.' });
    }

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      console.log('❌ Azure 凭据未配置');
      return res.status(500).json({ error: 'Azure Speech credentials are not configured.' });
    }

    console.log('🌐 调用 Azure TTS:', {
      region,
      voice,
      keyLength: key.length,
      ssmlLength: ssml.length
    });

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const azureRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-MICROSOFT-OUTPUTFORMAT': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'avatar-mgmt-v1',
      },
      body: ssml,
    });

    console.log('📥 Azure 响应:', {
      status: azureRes.status,
      statusText: azureRes.statusText,
      ok: azureRes.ok,
      headers: Object.fromEntries(azureRes.headers.entries())
    });

    if (!azureRes.ok) {
      const errTxt = await azureRes.text();
      console.error('❌ Azure TTS 请求失败:', errTxt);
      console.error('Response status:', azureRes.status);
      console.error('Response headers:', Object.fromEntries(azureRes.headers.entries()));
      return res.status(500).json({ error: 'Azure TTS request failed', details: errTxt });
    }

    const arrayBuffer = await azureRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('✅ Azure TTS 成功:', {
      bufferSize: buffer.length,
      audioSizeKB: (buffer.length / 1024).toFixed(2),
      contentType: azureRes.headers.get('content-type')
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时
    console.log('azure-tts handler success for text:', ssml.slice(0, 100));
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('❌ Azure TTS handler 错误:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 
