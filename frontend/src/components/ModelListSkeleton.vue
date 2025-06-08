<template>
  <div class="model-list-skeleton">
    <div class="skeleton-header">
      <div class="skeleton-title"></div>
      <div class="skeleton-tip"></div>
    </div>
    
    <div class="skeleton-actions">
      <div class="skeleton-button"></div>
    </div>

    <div class="skeleton-list">
      <div v-for="i in 3" :key="i" class="skeleton-item">
        <div class="skeleton-info">
          <div class="skeleton-name"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-meta">
            <div class="skeleton-meta-item"></div>
            <div class="skeleton-meta-item"></div>
          </div>
        </div>
        <div class="skeleton-actions">
          <div class="skeleton-button"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 骨架屏组件不需要任何逻辑
</script>

<style lang="scss" scoped>
.model-list-skeleton {
  max-width: 1200px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.skeleton-header {
  margin-bottom: 24px;
}

.skeleton-title {
  height: 32px;
  width: 200px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: pulse 1.5s infinite;
}

.skeleton-tip {
  height: 60px;
  background: #f0f0f0;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}

.skeleton-actions {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.skeleton-button {
  height: 36px;
  width: 120px;
  background: #f0f0f0;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.skeleton-info {
  flex: 1;
}

.skeleton-name {
  height: 24px;
  width: 200px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite;
}

.skeleton-description {
  height: 16px;
  width: 300px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: pulse 1.5s infinite;
}

.skeleton-meta {
  display: flex;
  gap: 20px;
}

.skeleton-meta-item {
  height: 16px;
  width: 120px;
  background: #f0f0f0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style> 