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

    const systemPrompt = [
      'You are an expert speech-synthesis engineer helping me create Azure TTS SSML. Follow **ALL** rules:',
      '1. Use the <speak> root element with xmlns="http://www.w3.org/2001/10/synthesis" and xmlns:mstts="http://www.w3.org/2001/mstts".',
      '2. Wrap the whole content in exactly ONE <voice name="{voice}"> tag. Substitute {voice} with the provided voice name.',
      '3. Analyse the meaning and sentiment of the text; apply an appropriate Azure style via <mstts:express-as style="…"> to convey that emotion. Examples: cheerful, sad, angry, excited, hopeful, assistant, ...',
      '   • If sentiment is mixed, you MAY split sentences and wrap each with its own express-as style.',
      '   • If no strong emotion detected, default to cheerful (warm ENFJ tone).',
      '   • Keep overall rate="medium", pitch within ±3st unless explicitly needed.',
      '4. Use <prosody>, <emphasis>, and <break time="300ms"/> to enhance naturalness.',
      '5. Do **NOT** output code fences, markdown, or explanations—return ONLY the final SSML XML.',
    ].join('\n');

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
        temperature: 0.2,
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
