import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
import { createI18n } from 'vue-i18n';
import messages from './locales';
import './assets/styles/global.scss';
import { useAuthStore } from './store';

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

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
});

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(i18n);

const auth = useAuthStore();
auth.initAuth();

app.mount('#app'); 