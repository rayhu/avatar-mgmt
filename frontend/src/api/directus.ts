import axios from 'axios';

const _API_URL = import.meta.env.VITE_API_URL;

export async function login(_email: string, _password: string) {
  // TODO: 调用 Directus Auth API
  // return axios.post(`${_API_URL}/auth/login`, { email: username, password });
  return { user: { id: '1', role: 'admin', name: _email }, token: 'mock-token' };
}

export async function logout(_token: string) {
  // Implementation
}

export async function fetchModels(token: string) {
  // TODO: 拉取模型列表
  // return axios.get(`${_API_URL}/items/models`, { headers: { Authorization: `Bearer ${token}` } });
  return [];
} 
