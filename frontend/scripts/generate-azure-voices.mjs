#!/usr/bin/env node
// Generate public/azure-voices-zh.json from Azure TTS REST API.
// Run inside frontend directory:  node scripts/generate-azure-voices.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env two levels up (project root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const KEY = process.env.VITE_AZURE_SPEECH_KEY || process.env.AZURE_SPEECH_KEY;
const REGION = process.env.VITE_AZURE_SPEECH_REGION || process.env.AZURE_SPEECH_REGION;

if (!KEY || !REGION) {
  console.error('❌ Azure credentials not found in .env');
  process.exit(1);
}

const endpoint = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

try {
  const res = await fetch(endpoint, {
    headers: {
      'Ocp-Apim-Subscription-Key': KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  const zhVoices = data.filter((v) => v.Locale === 'zh-CN');
  const mapped = zhVoices.map((v) => ({
    name: v.ShortName || v.Name,
    label: `${v.Locale} – ${v.LocalName}`,
    styles: v.StyleList ?? [],
    roles: v.RolePlayList ?? [],
  }));

  const outPath = path.resolve(__dirname, '../public/azure-voices-zh.json');
  await fs.writeFile(outPath, JSON.stringify(mapped, null, 2), 'utf8');
  console.log(`✅ Written ${mapped.length} voices to ${outPath}`);
} catch (err) {
  console.error('Fetch error:', err);
  process.exit(1);
}
