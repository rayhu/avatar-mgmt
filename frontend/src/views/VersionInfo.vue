<template>
  <div class="version-page">
    <div class="page-header">
      <h1>🔧 系统版本信息</h1>
      <p class="page-description">
        查看前端、后端和系统的详细版本信息，包括Git提交记录、构建时间和运行状态
      </p>
    </div>

    <VersionInfo />

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
import VersionInfo from '../components/VersionInfo.vue'
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

.additional-info {
  margin-top: 40px;
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
  
  .additional-info {
    grid-template-columns: 1fr;
  }
}
</style>
