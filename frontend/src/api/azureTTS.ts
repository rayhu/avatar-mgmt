import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;

// Azure TTS API 封装（模板）
export async function synthesizeSpeech(
  text: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
): Promise<Blob> {
  if (!SPEECH_KEY || !SPEECH_REGION) {
    throw new Error('Azure Speech credentials not configured');
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
  speechConfig.speechSynthesisVoiceName = voice;

  const pullStream = sdk.AudioOutputStream.createPullStream();

  const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const audioData = result.audioData;
          const blob = new Blob([audioData], { type: 'audio/wav' });
          resolve(blob);
        } else {
          reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
        }
        synthesizer.close();
      },
      (error) => {
        synthesizer.close();
        reject(error);
      },
    );
  });
}
