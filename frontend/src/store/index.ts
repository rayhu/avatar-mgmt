import { defineStore } from 'pinia';
import { logger } from '@/utils/logger';

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
      logger.store('设置用户信息', {
        component: 'AuthStore',
        method: 'setUser',
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        tokenLength: token.length
      });
      
      this.user = user;
      this.token = token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
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
          name: this.user.name
        } : null
      });
      
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
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

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          this.token = token;
          this.user = user;
          
          logger.info('从本地存储恢复用户信息', {
            component: 'AuthStore',
            method: 'initAuth',
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            tokenLength: token.length
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
