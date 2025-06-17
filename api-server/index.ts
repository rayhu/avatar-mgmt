import express from 'express';

import openaiHandler from './api/openai-ssml.ts';
import azureTTSHandler from './api/azure-tts.ts';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/api/openai-ssml', openaiHandler);
app.post('/api/azure-tts', azureTTSHandler);

app.get('/health', (_req, res) => res.send('ok'));

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Avatar API Server listening on port ${port}`);
}); 
