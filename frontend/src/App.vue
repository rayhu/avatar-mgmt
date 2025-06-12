<template>
  <div>
    <Analytics />
    <nav class="main-nav">
      <div class="nav-left">
        <template v-if="auth.isAuthenticated">
          <router-link v-if="auth.isAdmin" to="/admin">{{
            t('modelManagement.title')
          }}</router-link>
          <router-link to="/user">{{ t('modelManagement.modelGallery') }}</router-link>
          <router-link to="/animate">{{ t('animate.title') }}</router-link>
          <router-link v-if="auth.isAdmin" to="/test">{{ t('test.title') }}</router-link>
        </template>
        <template v-else>
          <router-link to="/login">{{ t('login.title') }}</router-link>
        </template>
      </div>
      <div class="nav-right">
        <template v-if="auth.isAuthenticated">
          <span class="user-info">
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
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import { onMounted } from 'vue';

const auth = useAuthStore();
const router = useRouter();
const { t, locale } = useI18n();

function logout() {
  auth.clearUser();
  router.push('/login');
}

onMounted(() => {
  const savedLocale = localStorage.getItem('preferred-language');
  if (savedLocale) {
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

  .nav-left {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

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
