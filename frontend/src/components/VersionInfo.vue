<template>
  <div class="version-info">
    <div class="version-header">
      <h3>{{ t('about.version') }}</h3>
      <button @click="refreshVersion" :disabled="loading" class="refresh-btn">
        {{ loading ? t('about.refreshing') : t('about.refresh') }}
      </button>
    </div>

    <div class="version-grid">
      <!-- 前端版本 -->
              <div class="version-card frontend">
          <div class="card-header">
            <span class="icon">🌐</span>
            <h4>{{ t('about.frontend') }}</h4>
          </div>
          <div class="card-content">
            <div class="version-item">
              <span class="label">{{ t('about.versionNumber') }}:</span>
              <span class="value">{{ versionInfo.frontend?.version || '未知' }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.commitHash') }}:</span>
              <span class="value hash">{{ versionInfo.frontend?.commitHash || '未知' }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.buildTime') }}:</span>
              <span class="value">{{ formatTime(versionInfo.frontend?.buildTime) }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.branch') }}:</span>
              <span class="value branch">{{ versionInfo.frontend?.branch || '未知' }}</span>
            </div>
            <div class="version-item">
              <span class="label">{{ t('about.commitDate') }}:</span>
              <span class="value">{{ formatTime(versionInfo.frontend?.commitDate) }}</span>
            </div>
          </div>
        </div>

      <!-- 后端版本 -->
      <div class="version-card backend">
        <div class="card-header">
          <span class="icon">⚙️</span>
          <h4>后端版本</h4>
        </div>
        <div class="card-content">
          <div class="version-item">
            <span class="label">版本号:</span>
            <span class="value">{{ versionInfo.backend?.version || '未知' }}</span>
          </div>
          <div class="version-item">
            <span class="label">Commit Hash:</span>
            <span class="value hash">{{ versionInfo.backend?.commitHash || '未知' }}</span>
          </div>
          <div class="version-item">
            <span class="label">构建时间:</span>
            <span class="value">{{ formatTime(versionInfo.backend?.buildTime) }}</span>
          </div>
          <div class="version-item">
            <span class="label">分支:</span>
            <span class="value branch">{{ versionInfo.backend?.branch || '未知' }}</span>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="version-card system">
        <div class="card-header">
          <span class="icon">🖥️</span>
          <h4>系统信息</h4>
        </div>
        <div class="card-content">
          <div class="version-item">
            <span class="label">环境:</span>
            <span class="value environment">{{ versionInfo.system?.environment || '未知' }}</span>
          </div>
          <div class="version-item">
            <span class="label">部署时间:</span>
            <span class="value">{{ formatTime(versionInfo.system?.deployTime) }}</span>
          </div>
          <div class="version-item">
            <span class="label">运行时间:</span>
            <span class="value">{{ versionInfo.system?.uptime || '未知' }}</span>
          </div>
          <div class="version-item">
            <span class="label">最后检查:</span>
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
      最后更新: {{ formatTime(lastUpdate?.toISOString()) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

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

// 格式化时间
const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '未知'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return timeStr
  }
}

// 获取版本信息
const fetchVersionInfo = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/version')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    versionInfo.value = data
    lastUpdate.value = new Date()
  } catch (err: any) {
    error.value = `获取版本信息失败: ${err.message}`
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
.version-info {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  min-width: 80px;
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

@media (max-width: 768px) {
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
}
</style>
