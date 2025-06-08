<template>
  <div class="user-model-gallery">
    <h2>模型画廊 (User)</h2>
    <!-- TODO: 展示就绪模型卡片，支持点击查看详情 -->
    <p>这里将展示所有"就绪"状态的模型，用户可浏览和查看详情。</p>
  </div>
</template>

<script setup lang="ts">
const baseUrl = window.location.origin;
// TODO: 拉取"就绪"模型列表
</script>

<style scoped>
.user-model-gallery {
  max-width: 900px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.deployment-section {
  margin-bottom: 20px;
}
.deployment-link {
  display: inline-block;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.3s ease;
}
.deployment-link:hover {
  background: #e9ecef;
}
</style> 