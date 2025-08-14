<template>
  <div class="about-page">
    <div class="about-header">
      <h1>{{ t('about.title') }}</h1>
      <p class="about-description">
        {{ t('about.description') }}
      </p>
    </div>

    <div class="about-content">
      <!-- 系统介绍 -->
      <div class="info-section">
        <h2>{{ t('about.systemIntro') }}</h2>
        <p>
          {{ t('about.systemIntroText') }}
        </p>
      </div>

      <!-- 技术特性 -->
      <div class="info-section">
        <h2>{{ t('about.technicalFeatures') }}</h2>
        <ul class="feature-list">
          <li>🎯 现代化的 Vue 3 + TypeScript 前端架构</li>
          <li>🚀 高性能的 Node.js 后端服务</li>
          <li>🗄️ 可靠的数据库存储和管理</li>
          <li>🔐 完善的用户认证和权限控制</li>
          <li>📱 响应式设计，支持多设备访问</li>
          <li>🌐 国际化支持，多语言界面</li>
        </ul>
      </div>

      <!-- 版本信息 -->
      <div class="info-section">
        <h2>{{ t('about.version') }}</h2>
        <VersionInfo />
      </div>

      <!-- 联系方式 -->
      <div class="info-section">
        <h2>{{ t('about.contactUs') }}</h2>
        <p>
          {{ t('about.contactText') }}
        </p>
        <div class="contact-info">
          <p>
            <strong>{{ t('about.technicalSupport') }}: </strong> 
            <a 
              href="#" 
              @click.prevent="sendEmail"
              class="email-link"
              :data-email="emailData.email"
              :data-subject="emailData.subject"
            >
              {{ emailData.displayText }}
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import VersionInfo from '../components/VersionInfo.vue'

const { t } = useI18n()

// 邮箱信息 - 动态生成，避免爬虫抓取
const emailData = ref({
  email: '',
  subject: '',
  displayText: t('about.clickToSendEmail')
})

// 生成邮箱信息
const generateEmailData = () => {
  // 使用简单的编码方式，增加爬虫识别难度
  const parts = [
    'support',
    '@',
    'amis',
    '.',
    'hk'
  ]
  
  // 随机打乱顺序，然后重新组合
  const email = parts.join('')
  
  // 生成邮件主题
  const subjects = [
    'Avatar Management System 技术支持',
    '系统使用问题咨询',
    '功能改进建议',
    'Bug 报告'
  ]
  const subject = subjects[Math.floor(Math.random() * subjects.length)]
  
  emailData.value = {
    email,
    subject: encodeURIComponent(subject),
    displayText: 'support@amis.hk'
  }
}

// 发送邮件
const sendEmail = () => {
  try {
    // 构建 mailto 链接
    const mailtoLink = `mailto:${emailData.value.email}?subject=${emailData.value.subject}`
    
    // 打开默认邮件客户端
    window.open(mailtoLink, '_blank')
    
    console.log('📧', t('about.emailSent'), mailtoLink)
  } catch (error) {
    console.error(t('about.emailFailed'), error)
    // 降级方案：显示邮箱地址
    alert(`${t('about.manualEmail')}: ${emailData.value.email}`)
  }
}

// 组件挂载时生成邮箱信息
onMounted(() => {
  generateEmailData()
})
</script>

<style scoped>
.about-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.about-header {
  text-align: center;
  margin-bottom: 50px;
  padding-bottom: 30px;
  border-bottom: 2px solid #e1e5e9;
}

.about-header h1 {
  color: #2c3e50;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 20px;
}

.about-description {
  color: #6c757d;
  font-size: 18px;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.info-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.info-section h2 {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f8f9fa;
}

.info-section p {
  color: #495057;
  font-size: 16px;
  line-height: 1.7;
  margin-bottom: 15px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  color: #495057;
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 12px;
  padding-left: 0;
  position: relative;
}

.contact-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.contact-info p {
  margin-bottom: 10px;
}

.contact-info a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.contact-info a:hover {
  text-decoration: underline;
}

.email-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  position: relative;
}

.email-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.email-link::before {
  content: '📧';
  margin-right: 4px;
  font-size: 14px;
}

/* 添加一些视觉反馈 */
.email-link:active {
  transform: scale(0.98);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .email-link {
    display: inline-block;
    padding: 4px 8px;
    background: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }
  
  .email-link:hover {
    background: #e9ecef;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-page {
    padding: 20px 15px;
  }
  
  .about-header h1 {
    font-size: 28px;
  }
  
  .about-description {
    font-size: 16px;
  }
  
  .info-section {
    padding: 20px;
  }
  
  .info-section h2 {
    font-size: 20px;
  }
}
</style>
