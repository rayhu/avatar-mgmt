<template>
  <div>
    <nav class="main-nav">
      <!-- 桌面端导航 -->
      <div class="nav-left desktop-nav">
        <template v-if="auth.isAuthenticated">
          <router-link v-if="auth.isAdmin" to="/admin">{{
            t('modelManagement.title')
          }}</router-link>
          <router-link to="/user">{{ t('modelManagement.modelGallery') }}</router-link>
        </template>
        <template v-else>
          <router-link to="/login">{{ t('login.title') }}</router-link>
        </template>
        <!-- 关于链接 - 始终显示 -->
        <router-link to="/about" class="about-link">{{ t('common.about') }}</router-link>
      </div>
      
      <!-- 移动端菜单按钮 -->
      <div class="mobile-nav-container">
        <MobileMenu />
      </div>
      
      <div class="nav-right">
        <template v-if="auth.isAuthenticated">
          <span class="user-info desktop-only">
            {{ auth.user?.name }}（{{ t(auth.user?.role === 'admin' ? 'admin' : 'user') }}）
            <a href="#" @click.prevent="logout">{{ t('logout') }}</a>
          </span>
        </template>
        <LanguageSwitcher />
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './store';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { inject } from '@vercel/analytics';
import { onMounted, watch } from 'vue';
import { logger } from './utils/logger';

const auth = useAuthStore();
const router = useRouter();
const { t, locale } = useI18n();

function logout() {
  logger.userAction('用户登出', {
    component: 'App',
    method: 'logout',
    userRole: auth.user?.role,
    userName: auth.user?.name
  });
  
  auth.clearUser();
  router.push('/login');
  
  logger.info('用户已登出并跳转到登录页', {
    component: 'App',
    method: 'logout'
  });
}

// 监听路由变化
watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
  logger.route(oldPath || '/', newPath, {
    component: 'App',
    isAuthenticated: auth.isAuthenticated,
    userRole: auth.user?.role
  });
});

// 在组件挂载时注入 Vercel Analytics
onMounted(() => {
  logger.info('App 组件挂载', {
    component: 'App',
    method: 'onMounted',
    isAuthenticated: auth.isAuthenticated,
    userRole: auth.user?.role
  });
  
  const enableAnalytics = import.meta.env.VITE_ANALYTICS === 'true';
  if (enableAnalytics) {
    logger.info('启用 Vercel Analytics', {
      component: 'App',
      method: 'onMounted'
    });
    inject();
  }
  
  const savedLocale = localStorage.getItem('preferred-language');
  if (savedLocale) {
    logger.info('恢复用户语言偏好', {
      component: 'App',
      method: 'onMounted',
      savedLocale,
      currentLocale: locale.value
    });
    locale.value = savedLocale;
  }
});
</script>

<style lang="scss">
body {
  margin: 0;
  font-family:
    'Inter', 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    sans-serif;
  background: #f5f6fa;
}

.main-nav {
  display: flex;
  justify-content: space-between;
  padding: 16px 32px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;

  // 移动端适配
  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
    
    &.mobile-collapsed {
      flex-direction: row;
      
      .nav-left {
        display: none;
      }
    }
  }

  .nav-left {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  
  .desktop-nav {
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  .mobile-nav-container {
    display: none;
    
    @media (max-width: 768px) {
      display: block;
    }
  }
  
  .desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    @media (max-width: 768px) {
      gap: 12px;
    }
  }

  a {
    color: #2c3e50;
    text-decoration: none;
    font-weight: bold;
    font-size: 1.1em;
    transition: color 0.2s;
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 6px;
    
    @media (max-width: 768px) {
      font-size: 0.95em;
      padding: 6px 10px;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9em;
      padding: 6px 8px;
    }
    
    &:hover {
      color: #42b883;
      background-color: rgba(66, 184, 131, 0.1);
    }
    
    &:active {
      background-color: rgba(66, 184, 131, 0.2);
    }
  }
}

.user-info {
  color: #888;
  font-size: 0.95em;
  a {
    margin-left: 12px;
    color: #e74c3c;
    cursor: pointer;
    text-decoration: underline;
  }
}
</style>
