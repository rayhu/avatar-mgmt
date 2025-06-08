<template>
  <div>
    <nav class="main-nav">
      <router-link v-if="auth.isAdmin" to="/admin">模型管理</router-link>
      <router-link to="/user">模型库</router-link>
      <router-link to="/animate">动画与语音</router-link>
      <router-link to="/test">测试页面</router-link>
      <span v-if="auth.isAuthenticated" class="user-info">
        {{ auth.user?.name }}（{{ auth.user?.role }}）
        <a href="#" @click.prevent="logout">退出</a>
      </span>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './store';
import { useRouter } from 'vue-router';
const auth = useAuthStore();
const router = useRouter();

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