import apiClient from './axios';

export async function generateSSMLBackend(text: string, voice: string) {
  try {
    const response = await apiClient.post('/api/openai-ssml', {
      text,
      voice,
      model: 'gpt-4o',
    });
    return response.data.ssml as string;
  } catch (error: any) {
    throw new Error(`SSML生成失败: ${error.response?.data?.message || error.message}`);
  }
}
