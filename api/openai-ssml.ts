import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    const systemPrompt =
      'You are a speech synthesis engineer. Convert the given Chinese text into valid Azure TTS SSML. Requirements:\n' +
      '- Use the <speak> root element with the correct xmlns attribute.\n' +
      '- Wrap content in a <voice> tag using the voice name provided.\n' +
      '- Apply a <prosody> tag with suitable rate="medium" and pitch="+0Hz".\n' +
      '- Insert <break time="300ms"/> at appropriate long pauses.\n' +
      '- Return ONLY the SSML XML without any additional commentary.';

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
        temperature: 0.7,
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
