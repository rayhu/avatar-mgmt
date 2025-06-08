<template>
  <div>
    <Analytics />
    <nav class="main-nav">
      <template v-if="auth.isAuthenticated">
        <router-link v-if="auth.isAdmin" to="/admin">{{ t('modelManagement.title') }}</router-link>
        <router-link to="/user">{{ t('modelManagement.modelGallery') }}</router-link>
        <router-link to="/animate">{{ t('animate.title') }}</router-link>
        <router-link v-if="auth.isAdmin" to="/test">{{ t('test.title') }}</router-link>
        <span class="user-info">
          {{ auth.user?.name }}（{{ t(auth.user?.role === 'admin' ? 'admin' : 'user') }}）
          <a href="#" @click.prevent="logout">{{ t('logout') }}</a>
        </span>
      </template>
      <template v-else>
        <router-link to="/login">{{ t('login.title') }}</router-link>
      </template>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './store';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { inject } from "@vercel/analytics"
const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

function logout() {
  auth.clearUser();
  router.push('/login');
}
</script>

<style lang="scss">
body {
  margin: 0;
  font-family: 'Inter', 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f5f6fa;
}

.main-nav {
  display: flex;
  gap: 24px;
  padding: 16px 32px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
  a {
    color: #2c3e50;
    text-decoration: none;
    font-weight: bold;
    font-size: 1.1em;
    transition: color 0.2s;
    &:hover {
      color: #42b883;
    }
  }
}
.user-info {
  margin-left: auto;
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