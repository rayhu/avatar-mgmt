import { defineStore } from 'pinia';
import { logger } from '@/utils/logger';

interface User {
  id: string;
  role: 'admin' | 'user';
  name: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => {
      const role = state.user?.role;
      return role === 'admin';
    },
  },

  actions: {
    setUser(user: User, token: string, refreshToken?: string) {
      logger.store('设置用户信息', {
        component: 'AuthStore',
        method: 'setUser',
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        userEmail: user.email,
        tokenLength: token.length
      });
      
      this.user = user;
      this.token = token;
      this.refreshToken = refreshToken || null;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      logger.info('用户信息已保存到本地存储', {
        component: 'AuthStore',
        method: 'setUser'
      });
    },

    clearUser() {
      logger.store('清除用户信息', {
        component: 'AuthStore',
        method: 'clearUser',
        previousUser: this.user ? {
          id: this.user.id,
          role: this.user.role,
          name: this.user.name,
          email: this.user.email
        } : null
      });
      
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      
      logger.info('用户信息已从本地存储清除', {
        component: 'AuthStore',
        method: 'clearUser'
      });
    },

    initAuth() {
      logger.info('初始化认证状态', {
        component: 'AuthStore',
        method: 'initAuth'
      });
      
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          this.token = token;
          this.user = user;
          this.refreshToken = refreshToken;
          
          logger.info('从本地存储恢复用户信息', {
            component: 'AuthStore',
            method: 'initAuth',
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            userEmail: user.email,
            tokenLength: token.length,
            hasRefreshToken: !!refreshToken
          });
        } catch (error) {
          const err = error as Error;
          logger.error('解析用户数据失败', {
            component: 'AuthStore',
            method: 'initAuth',
            error: err.message,
            errorType: err.constructor.name
          });
          this.clearUser();
        }
      } else {
        logger.info('本地存储中没有用户信息', {
          component: 'AuthStore',
          method: 'initAuth',
          hasToken: !!token,
          hasUserStr: !!userStr
        });
        this.clearUser();
      }
    },
  },
});
