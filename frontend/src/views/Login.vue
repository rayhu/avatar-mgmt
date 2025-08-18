<template>
  <div class="login-container">
    <div class="login-box">
      <h2>{{ $t('login.title') }}</h2>
      <form class="login-form" @submit.prevent="onLogin">
        <div class="form-group">
          <label for="email">{{ $t('login.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :placeholder="$t('login.emailPlaceholder')"
            :disabled="loading"
            required
          />
        </div>
        <div v-if="emailError" class="error-message">
          {{ emailError }}
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
import { login } from '../api/auth';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

// Email 验证规则
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email 验证状态
const emailError = computed(() => {
  if (!email.value) return '';

  if (!emailPattern.test(email.value)) {
    return t('login.emailInvalid');
  }

  return '';
});

// 表单是否有效
const isFormValid = computed(() => {
  return email.value && !emailError.value && password.value && !loading.value;
});

async function onLogin() {
  if (loading.value || !isFormValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    // 调用 Directus 认证 API
    const data = await login(email.value, password.value);

    if (data.success) {
      // 处理用户角色信息
      let userRole: 'admin' | 'user' = 'user'; // 默认角色
      
      // 检查角色信息
      if (data.user.role) {
        if (typeof data.user.role === 'string') {
          // 如果是字符串，检查是否为角色名称
          const roleStr = data.user.role;
          if (roleStr === 'Administrator' || roleStr === 'admin' || roleStr === 'Admin') {
            userRole = 'admin';
          } else if (roleStr === 'user' || roleStr === 'User') {
            userRole = 'user';
          } else {
            // 可能是角色ID，需要进一步处理
            console.warn('⚠️ 未知的角色值:', data.user.role);
            // 暂时设置为 user，后续可以通过 API 获取真实角色
            userRole = 'user';
          }
        } else if (typeof data.user.role === 'object' && data.user.role.name) {
          // 如果是对象，使用角色名称
          const roleName = data.user.role.name;
          if (roleName === 'Administrator' || roleName === 'admin' || roleName === 'Admin') {
            userRole = 'admin';
          } else if (roleName === 'user' || roleName === 'User') {
            userRole = 'user';
          }
        }
      }
      
      console.log('🔍 角色处理结果:', {
        originalRole: data.user.role,
        processedRole: userRole,
        roleType: typeof data.user.role
      });

      // 使用处理后的角色信息
      auth.setUser(
        {
          id: data.user.id,
          role: userRole, // 使用处理后的角色
          name: data.user.name,
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
        },
        data.token,
        data.refresh_token
      );

      // 根据用户角色跳转到不同页面
      if (userRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } else {
      throw new Error('Login failed');
    }
  } catch (e: any) {
    console.error('Login error:', e);
    // 显示具体的错误信息
    if (e.response?.status === 401) {
      error.value = t('login.invalidCredentials');
    } else if (e.response?.status === 503) {
      error.value = t('login.serviceUnavailable');
    } else {
      error.value = e.response?.data?.message || e.message || t('login.error');
    }
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
