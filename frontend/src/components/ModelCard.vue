<template>
  <div class="model-card">
    <img
      v-if="previewUrl"
      :src="previewUrl"
      alt="模型缩略图"
      class="model-thumbnail"
    />
    <div v-else class="no-preview">无缩略图</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  previewUrl?: string;
}>();
</script>

<script lang="ts">
export default {
  name: 'ModelCard',
};
</script>

<style scoped>
.model-card {
  width: 100%;
  height: 200px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.model-thumbnail {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.no-preview {
  color: #aaa;
  font-size: 16px;
}
</style>
