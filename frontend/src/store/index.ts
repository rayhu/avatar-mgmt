import { defineStore } from 'pinia';

interface User {
  id: string;
  role: 'admin' | 'user';
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },
  
  actions: {
    setUser(user: User, token: string) {
      this.user = user;
      this.token = token;
      localStorage.setItem('token', token);
    },
    
    clearUser() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
    },
    
    initAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        // TODO: 验证 token 并获取用户信息
        this.token = token;
      }
    },
  },
}); 