import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
import { createI18n } from 'vue-i18n';
import messages from './locales';
import './assets/styles/global.scss';
import { useAuthStore } from './store';

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
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