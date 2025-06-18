// import type { VercelRequest, VercelResponse } from '@vercel/node';

// POST /api/azure-tts
// Body: { ssml: string }
// Returns: binary audio (mp3)
// Requires env vars: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ssml } = req.body as { ssml?: string };

    if (!ssml || typeof ssml !== 'string' || !ssml.trim()) {
      return res.status(400).json({ error: 'Parameter "ssml" is required.' });
    }

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      return res.status(500).json({ error: 'Azure Speech credentials are not configured.' });
    }

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const azureRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-Output-Format': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'avatar-mgmt-v1',
      },
      body: ssml,
    });

    if (!azureRes.ok) {
      const errTxt = await azureRes.text();
      return res.status(500).json({ error: 'Azure TTS request failed', details: errTxt });
    }

    const arrayBuffer = await azureRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('azure-tts handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
