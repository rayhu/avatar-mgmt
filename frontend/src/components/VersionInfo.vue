<template>
  <div class="version-page">
    <div class="page-header">
      <h1>🔧 系统版本信息</h1>
      <p class="page-description">
        查看前端、后端和系统的详细版本信息，包括Git提交记录、构建时间和运行状态
      </p>
    </div>

    <div class="version-info">
      <div class="version-header">
        <h3>版本信息</h3>
        <button @click="refreshVersion" :disabled="loading" class="refresh-btn">
          {{ loading ? '🔄 刷新中...' : '🔄 刷新' }}
        </button>
      </div>

      <div class="version-grid">
        <!-- 前端版本 -->
        <div class="version-card frontend">
          <div class="card-header">
            <span class="icon">��</span>
            <h4>前端版本</h4>
          </div>
          <div class="card-content">
            <div class="version-item">
              <span class="label">版本号:</span>
              <span class="value">{{ versionInfo.frontend?.version || '未知' }}</span>
            </div>
            <div class="version-item">
              <span class="label">Commit Hash:</span>
              <span class="value hash">{{ versionInfo.frontend?.commitHash || '未知' }}</span>
            </div>
            <div class="version-item">
              <span class="label">构建时间:</span>
              <span class="value">{{ formatTime(versionInfo.frontend?.buildTime) }}</span>
            </div>
            <div class="version-item">
              <span class="label">分支:</span>
              <span class="value branch">{{ versionInfo.frontend?.branch || '未知' }}</span>
            </div>
            <div class="version-item">
              <span class="label">提交日期:</span>
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

    <!-- 有用的附加信息 -->
    <div class="additional-info">
      <div class="info-section">
        <h3>📋 版本信息说明</h3>
        <ul>
          <li><strong>版本号:</strong> 基于日期和Git提交哈希生成的唯一标识</li>
          <li><strong>Commit Hash:</strong> Git提交的短哈希值，用于追踪代码变更</li>
          <li><strong>构建时间:</strong> 代码构建完成的时间戳</li>
          <li><strong>分支:</strong> 当前部署的Git分支名称</li>
          <li><strong>环境:</strong> 当前运行的环境（development/staging/production）</li>
          <li><strong>运行时间:</strong> 系统启动后的运行时长</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🚀 如何使用</h3>
        <ol>
          <li>点击"刷新"按钮获取最新版本信息</li>
          <li>对比前后端版本确保一致性</li>
          <li>使用Commit Hash在Git中查找具体变更</li>
          <li>监控系统运行时间和部署状态</li>
        </ol>
      </div>

      <div class="info-section">
        <h3>🔍 故障排查</h3>
        <ul>
          <li>如果版本信息显示"未知"，请检查网络连接</li>
          <li>前后端版本不一致可能导致功能异常</li>
          <li>运行时间异常可能表示系统重启</li>
          <li>环境标识错误可能影响功能配置</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getApiUrl } from '@/config/api'

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
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
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

.additional-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
