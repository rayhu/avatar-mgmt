import axios from 'axios';

const API_URL = import.meta.env.VITE_DIRECTUS_API_URL || 'http://localhost:8055';

export async function login(username: string, password: string) {
  // TODO: 调用 Directus Auth API
  // return axios.post(`${API_URL}/auth/login`, { email: username, password });
  return { user: { id: '1', role: 'admin', name: username }, token: 'mock-token' };
}

export async function fetchModels(token: string) {
  // TODO: 拉取模型列表
  // return axios.get(`${API_URL}/items/models`, { headers: { Authorization: `Bearer ${token}` } });
  return [];
} 