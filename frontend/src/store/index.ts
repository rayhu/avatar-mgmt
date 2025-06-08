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
      localStorage.setItem('user', JSON.stringify(user));
    },
    
    clearUser() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    initAuth() {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          this.token = token;
          this.user = user;
        } catch (error) {
          console.error('Error parsing user data:', error);
          this.clearUser();
        }
      } else {
        this.clearUser();
      }
    }
  }
}); 