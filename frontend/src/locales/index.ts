import { createI18n } from 'vue-i18n';

const messages = {
  'zh-CN': {
    login: {
      title: '登录',
      username: '用户名',
      usernamePlaceholder: '请输入用户名',
      password: '密码',
      passwordPlaceholder: '请输入密码',
      submit: '登录',
      error: '登录失败，请检查用户名和密码',
    },
    logout: '退出',
    admin: '管理员',
    user: '用户',
    model: '模型',
    ready: '就绪',
    draft: '草稿',
    offline: '下线',
    animate: {
      title: '动画与语音',
      text: '文本内容',
      textPlaceholder: '请输入要合成的文字',
      emotion: '表情',
      emotions: {
        happy: '高兴',
        sad: '悲伤',
        angry: '生气',
        neutral: '平静',
      },
      action: '动作',
      actions: {
        wave: '挥手',
        jump: '跳跃',
        nod: '点头',
        idle: '待机',
      },
      submit: '生成动画和语音',
    },
  },
  'en': {
    login: {
      title: 'Login',
      username: 'Username',
      usernamePlaceholder: 'Please enter your username',
      password: 'Password',
      passwordPlaceholder: 'Please enter your password',
      submit: 'Login',
      error: 'Login failed, please check your username and password',
    },
    logout: 'Logout',
    admin: 'Admin',
    user: 'User',
    model: 'Model',
    ready: 'Ready',
    draft: 'Draft',
    offline: 'Offline',
    animate: {
      title: 'Animation & Voice',
      text: 'Text Content',
      textPlaceholder: 'Please enter the text to synthesize',
      emotion: 'Emotion',
      emotions: {
        happy: 'Happy',
        sad: 'Sad',
        angry: 'Angry',
        neutral: 'Neutral',
      },
      action: 'Action',
      actions: {
        wave: 'Wave',
        jump: 'Jump',
        nod: 'Nod',
        idle: 'Idle',
      },
      submit: 'Generate Animation & Voice',
    },
  },
};

export default messages; 