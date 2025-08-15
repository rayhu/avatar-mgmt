<template>
  <div class="version-page">
    <div class="page-header">
      <h1>{{ t('about.versionInfo.title') }}</h1>
      <p class="page-description">
        {{ t('about.versionInfo.description') }}
      </p>
    </div>

    <div class="version-info">
      <div class="version-header">
        <h3>{{ t('about.versionInfo.versionInfo') }}</h3>
        <button @click="refreshVersion" :disabled="loading" class="refresh-btn">
          {{ loading ? t('about.versionInfo.refreshing') : t('about.versionInfo.refresh') }}
        </button>
      </div>

      <div class="version-grid">
        <!-- 前端版本 -->
        <div class="version-card frontend">
          <div class="card-header">
            <span class="icon">💻</span>
            <h4>{{ t('about.versionInfo.frontendVersion') }}</h4>
          </div>
          <div class="card-content">
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.versionNumber') }}</span>
              <span class="value">{{ versionInfo.frontend?.version || t('about.versionInfo.unknown') }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.commitHash') }}</span>
              <span class="value hash">{{ versionInfo.frontend?.commitHash || t('about.versionInfo.unknown') }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.buildTime') }}</span>
              <span class="value">{{ formatTime(versionInfo.frontend?.buildTime) }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.branch') }}</span>
              <span class="value branch">{{ versionInfo.frontend?.branch || t('about.versionInfo.unknown') }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.commitDate') }}</span>
              <span class="value">{{ formatTime(versionInfo.frontend?.commitDate) }}</span>
            </div>
          </div>
        </div>

        <!-- 后端版本 -->
        <div class="version-card backend">
          <div class="card-header">
            <span class="icon">⚙️</span>
            <h4>{{ t('about.versionInfo.backendVersion') }}</h4>
          </div>
          <div class="card-content">
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.versionNumber') }}</span>
              <span class="value">{{ versionInfo.backend?.version || t('about.versionInfo.unknown') }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.commitHash') }}</span>
              <span class="value hash">{{ versionInfo.backend?.commitHash || t('about.versionInfo.unknown') }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.buildTime') }}</span>
              <span class="value">{{ formatTime(versionInfo.backend?.buildTime) }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.branch') }}</span>
              <span class="value branch">{{ versionInfo.backend?.branch || t('about.versionInfo.unknown') }}</span>
            </div>
          </div>
        </div>

        <!-- 系统信息 -->
        <div class="version-card system">
          <div class="card-header">
            <span class="icon">🖥️</span>
            <h4>{{ t('about.versionInfo.systemInfo') }}</h4>
          </div>
          <div class="card-content">
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.environment') }}</span>
              <span class="value environment">{{ versionInfo.system?.environment || t('about.versionInfo.unknown') }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.deployTime') }}</span>
              <span class="value">{{ formatTime(versionInfo.system?.deployTime) }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.uptime') }}</span>
              <span class="value">{{ versionInfo.system?.uptime || t('about.versionInfo.unknown') }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.versionInfo.lastCheck') }}</span>
              <span class="value">{{ formatTime(versionInfo.system?.lastCheck) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <!-- 更新时间 -->
      <div class="update-time">
        {{ t('about.versionInfo.lastUpdate') }}: {{ formatTime(lastUpdate?.toISOString()) }}
        <span class="separator">, </span>
            <router-link to="/env-test" class="env-test-link">
              🔧 {{ t('about.versionInfo.envTest') }}
            </router-link>
      </div>
    </div>

    <!-- 有用的附加信息 -->
    <div class="additional-info">
      <div class="info-section">
        <h3>{{ t('about.versionInfo.versionInfoDesc') }}</h3>
        <ul>
          <li><strong>{{ t('about.versionInfo.versionNumber') }}</strong> {{ t('about.versionInfo.versionNumberDesc') }}</li>
          <li><strong>{{ t('about.versionInfo.commitHash') }}</strong> {{ t('about.versionInfo.commitHashDesc') }}</li>
          <li><strong>{{ t('about.versionInfo.buildTime') }}</strong> {{ t('about.versionInfo.buildTimeDesc') }}</li>
          <li><strong>{{ t('about.versionInfo.branch') }}</strong> {{ t('about.versionInfo.branchDesc') }}</li>
          <li><strong>{{ t('about.versionInfo.environment') }}</strong> {{ t('about.versionInfo.environmentDesc') }}</li>
          <li><strong>{{ t('about.versionInfo.uptime') }}</strong> {{ t('about.versionInfo.uptimeDesc') }}</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>{{ t('about.versionInfo.howToUse') }}</h3>
        <ol>
          <li>{{ t('about.versionInfo.refreshButtonTip') }}</li>
          <li>{{ t('about.versionInfo.versionConsistencyTip') }}</li>
          <li>{{ t('about.versionInfo.commitHashTip') }}</li>
          <li>{{ t('about.versionInfo.monitoringTip') }}</li>
        </ol>
      </div>

      <div class="info-section">
        <h3>{{ t('about.versionInfo.troubleshooting') }}</h3>
        <ul>
          <li>{{ t('about.versionInfo.unknownVersionTip') }}</li>
          <li>{{ t('about.versionInfo.versionMismatchTip') }}</li>
          <li>{{ t('about.versionInfo.uptimeAbnormalTip') }}</li>
          <li>{{ t('about.versionInfo.environmentErrorTip') }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getApiUrl } from '../config/api'

const { t } = useI18n()

interface VersionInfo {
  frontend?: {
    version: string
    commitHash: string
    buildTime: string
    branch: string
    commitDate: string
  }
  backend?: {
    version: string
    commitHash: string
    buildTime: string
    branch: string
    commitDate: string
  }
  system?: {
    deployTime: string
    environment: string
    uptime: string
    lastCheck?: string
  }
  api?: {
    endpoint: string
    timestamp: string
    uptime: string
  }
  generatedAt?: string
}

const versionInfo = ref<VersionInfo>({})
const loading = ref(false)
const error = ref('')
const lastUpdate = ref<Date | null>(null)

// 格式化时间 - 改进版本，避免显示 "Invalid Date"
const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '暂无数据'
  
  try {
    const date = new Date(timeStr)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '无'
    }
    
    // 转换为中国时区 (UTC+8)
    const chinaTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))
    
    const formattedTime = chinaTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Shanghai'
    })
    
    return `${formattedTime} UTC+8`
  } catch {
    return '日期解析失败'
  }
}

// 获取版本信息
const fetchVersionInfo = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch(getApiUrl('version'))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    versionInfo.value = data
    lastUpdate.value = new Date()
  } catch (err: any) {
    error.value = `${t('about.versionInfo.error')} ${err.message}`
    console.error('Version info fetch error:', err)
  } finally {
    loading.value = false
  }
}

// 刷新版本信息
const refreshVersion = () => {
  fetchVersionInfo()
}

// 组件挂载时获取版本信息
onMounted(() => {
  fetchVersionInfo()
})
</script>

<style scoped>
.version-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 2.5rem;
}

.page-description {
  color: #666;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.version-info {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  margin-bottom: 40px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.version-header h3 {
  margin: 0;
  color: #333;
}

.refresh-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover:not(:disabled) {
  background: #0056b3;
}

.refresh-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.version-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.version-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid;
}

.version-card.frontend {
  border-left-color: #28a745;
}

.version-card.backend {
  border-left-color: #007bff;
}

.version-card.system {
  border-left-color: #ffc107;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.card-header .icon {
  font-size: 24px;
  margin-right: 10px;
}

.card-header h4 {
  margin: 0;
  color: #333;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.version-item .label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
}

.version-item .value {
  color: #333;
  font-weight: 600;
}

.version-item .hash {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.version-item .branch {
  color: #007bff;
  font-weight: 600;
}

.version-item .environment {
  color: #28a745;
  font-weight: 600;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}

.update-time {
  text-align: center;
  color: #666;
  font-size: 12px;
  font-style: italic;
}

.update-time .separator {
  color: #6c757d;
  margin: 0 8px;
}

.update-time .env-test-link {
  color: #28a745;
  text-decoration: none;
  font-weight: 500;
  font-size: 12px;
  transition: color 0.2s ease;
  margin-left: 8px;
}

.update-time .env-test-link:hover {
  color: #1e7e34;
  text-decoration: underline;
}

.update-time .env-test-link:active {
  transform: scale(0.98);
}

.additional-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.info-section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-section h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.3rem;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.info-section ul,
.info-section ol {
  color: #555;
  line-height: 1.8;
  padding-left: 20px;
}

.info-section li {
  margin-bottom: 8px;
}

.info-section strong {
  color: #333;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .version-grid {
    grid-template-columns: 1fr;
  }
  
  .version-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .version-item .label {
    min-width: auto;
  }
  
  .additional-info {
    grid-template-columns: 1fr;
  }
}
</style>
