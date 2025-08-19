import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
import { createI18n } from 'vue-i18n';
import messages from './locales';
import './assets/styles/global.scss';
import './assets/styles/mobile.scss';
import { useAuthStore } from './store';
import { logger } from '@/utils/logger';

// 获取浏览器语言
const getBrowserLanguage = () => {
  // 获取浏览器语言，格式如 'zh-CN' 或 'en-US'
  const browserLang = navigator.language;
  // 提取主要语言代码（如 'zh' 或 'en'）
  const mainLang = browserLang.split('-')[0];

  // 检查是否支持该语言
  if (mainLang === 'zh') {
    return 'zh-CN';
  } else if (mainLang === 'en') {
    return 'en';
  }

  // 如果浏览器语言不在支持列表中，返回默认语言
  return 'en';
};

// 优先使用浏览器语言，如果没有则使用保存的语言设置，最后使用默认语言
const savedLocale = localStorage.getItem('preferred-language') || getBrowserLanguage();

logger.info('应用启动', {
  component: 'Main',
  method: 'startup',
  browserLanguage: navigator.language,
  savedLocale,
  finalLocale: savedLocale,
  isDevelopment: import.meta.env.DEV,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
});

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
});

logger.info('i18n 初始化完成', {
  component: 'Main',
  method: 'startup',
  locale: savedLocale,
  fallbackLocale: 'en',
  availableLocales: Object.keys(messages),
});

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(i18n);

logger.info('Vue 应用插件安装完成', {
  component: 'Main',
  method: 'startup',
  plugins: ['pinia', 'router', 'i18n'],
});

const auth = useAuthStore();
auth.initAuth();

logger.info('认证状态初始化完成', {
  component: 'Main',
  method: 'startup',
  isAuthenticated: auth.isAuthenticated,
  userRole: auth.user?.role,
});

app.mount('#app');

logger.info('应用挂载完成', {
  component: 'Main',
  method: 'startup',
});
