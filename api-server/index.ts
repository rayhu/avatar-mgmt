import 'dotenv/config';


import express from 'express';

import openaiHandler from './handlers/openai-ssml';
import azureTTSHandler from './handlers/azure-tts';
import avatarsHandler from './handlers/avatars';
import generateSSMLHandler from './handlers/generate-ssml';

const app = express();

// 添加 CORS 支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '2mb' }));

app.post('/api/openai-ssml', openaiHandler);
app.post('/api/azure-tts', azureTTSHandler);
app.post('/api/generate-ssml', generateSSMLHandler);
app.get('/api/avatars', avatarsHandler);

app.get('/health', (_req, res) => res.send('ok'));

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Avatar API Server listening on port ${port}`);
}); 
