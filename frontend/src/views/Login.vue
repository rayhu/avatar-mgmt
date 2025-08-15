<template>
  <div class="login-container">
    <div class="login-box">
      <h2>{{ $t('login.title') }}</h2>
      <form class="login-form" @submit.prevent="onLogin">
        <div class="form-group">
          <label for="username">{{ $t('login.username') }}</label>
          <input
            id="username"
            v-model="username"
            :placeholder="$t('login.usernamePlaceholder')"
            :disabled="loading"
            required
          />
        </div>
        <div v-if="usernameError" class="error-message">
          {{ usernameError }}
        </div>
        <div class="form-group">
          <label for="password">{{ $t('login.password') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            :placeholder="$t('login.passwordPlaceholder')"
            :disabled="loading"
            required
          />
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <button type="submit" :disabled="loading" class="login-button">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>{{ $t('login.submit') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store';
import { useI18n } from 'vue-i18n';
import { getApiConfig } from '../config/api';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

// 用户名验证规则
const usernameRules = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_-]+$/, // 只允许字母、数字、下划线和连字符
};

// 用户名验证状态
const usernameError = computed(() => {
  if (!username.value) return '';

  if (username.value.length < usernameRules.minLength) {
    return t('login.usernameTooShort', { min: usernameRules.minLength });
  }

  if (username.value.length > usernameRules.maxLength) {
    return t('login.usernameTooLong', { max: usernameRules.maxLength });
  }

  if (!usernameRules.pattern.test(username.value)) {
    return t('login.usernameInvalid');
  }

  return '';
});

// 表单是否有效
const isFormValid = computed(() => {
  return username.value && !usernameError.value && password.value && !loading.value;
});

async function onLogin() {
  if (loading.value || !isFormValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    // 调用后端 API 进行登录验证
    const apiConfig = getApiConfig();
    const loginUrl = `${apiConfig.api.baseUrl}${apiConfig.api.endpoints.auth.login}`;
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();

    if (data.success) {
      // 使用 API 返回的用户信息
      auth.setUser(
        {
          id: data.user.id,
          role: data.user.role,
          name: data.user.name,
        },
        data.token,
      );

      // 根据用户角色跳转到不同页面
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } else {
      throw new Error('Login failed');
    }
  } catch (e) {
    console.error('Login error:', e);
    error.value = t('login.error');
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables.scss' as *;

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: $spacing-large;
  background: white;
  border-radius: $border-radius * 2;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: $text-color;
  margin-bottom: $spacing-large;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-medium;

  button {
    margin-top: $spacing-medium;
    padding: $spacing-medium;
    background: $primary-color;
    color: white;
    border: none;
    border-radius: $border-radius;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color $transition-duration $transition-timing;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: color.adjust($primary-color, $lightness: -10%);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-small;

  label {
    color: $text-color;
    font-size: 0.9rem;
  }

  input {
    padding: $spacing-medium;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    font-size: 1rem;
    transition: border-color $transition-duration $transition-timing;

    &:focus {
      outline: none;
      border-color: $primary-color;
    }

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  text-align: center;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
