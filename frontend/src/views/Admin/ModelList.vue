<template>
  <div class="admin-model-list">
    <h2>模型管理 (Admin)</h2>
    <!-- TODO: 列表、编辑、删除、状态切换等功能 -->
    <p>这里将展示所有模型，支持编辑、删除、设置状态等操作。</p>
  </div>
</template>

<script setup lang="ts">
const baseUrl = window.location.origin;
// TODO: 拉取模型列表，支持管理操作
</script>

<style scoped>
.admin-model-list {
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