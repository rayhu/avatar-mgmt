<template>
  <div class="model-gallery-skeleton">
    <div class="gallery-header">
      <div class="skeleton-title"></div>
      <div class="skeleton-tip"></div>
    </div>

    <div class="model-grid">
      <div v-for="i in 6" :key="i" class="model-card">
        <div class="skeleton-preview"></div>
        <div class="model-info">
          <div class="skeleton-name"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-meta"></div>
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
.model-gallery-skeleton {
  max-width: 1200px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.gallery-header {
  margin-bottom: 24px;
}

.skeleton-title {
  height: 32px;
  width: 200px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: pulse 1s infinite;
}

.skeleton-tip {
  height: 60px;
  background: #f0f0f0;
  border-radius: 6px;
  animation: pulse 1s infinite;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.model-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.skeleton-preview {
  width: 100%;
  height: 200px;
  background: #f0f0f0;
  animation: pulse 1s infinite;
}

.model-info {
  padding: 16px;
}

.skeleton-name {
  height: 24px;
  width: 70%;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
  animation: pulse 1s infinite;
}

.skeleton-description {
  height: 16px;
  width: 90%;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: pulse 1s infinite;
}

.skeleton-meta {
  height: 16px;
  width: 60%;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 16px;
  animation: pulse 1s infinite;
}

.skeleton-button {
  height: 36px;
  width: 100%;
  background: #f0f0f0;
  border-radius: 6px;
  animation: pulse 1s infinite;
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