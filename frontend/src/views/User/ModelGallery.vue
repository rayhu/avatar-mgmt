<template>
  <div class="user-model-gallery">
    <ModelGallerySkeleton v-if="loading" />
    <template v-else>
      <div class="gallery-header">
        <h2>{{ t('modelManagement.modelGallery') }}</h2>
        <div class="gallery-tip">
          <i class="tip-icon">ℹ️</i>
          <span>{{ t('modelManagement.galleryTip') }}</span>
        </div>
      </div>
      <div class="model-grid">
        <div v-for="model in readyModels" :key="model.id" class="model-card">
          <div class="model-preview">
            <ModelCard :preview-url="model.previewUrl" />
          </div>
          <div class="model-info">
            <h3>{{ model.name }}</h3>
            <p>{{ model.description }}</p>
            <div class="model-meta">
              <span
                >{{ t('modelManagement.modelInfo.createTime') }}:
                {{ formatDate(model.createTime) }}</span
              >
            </div>
            <button class="view-btn" @click="viewModel(model)">
              {{ t('modelManagement.viewModel') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelGallerySkeleton from '../../components/ModelGallerySkeleton.vue';
import ModelCard from '../../components/ModelCard.vue';
import type { Avatar } from '../../types/avatar';
import { getAvatars } from '../../api/avatars';

const { t } = useI18n();

const readyModels = ref<Avatar[]>([]);
const loading = ref(true);

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleString();
}

function viewModel(model: Avatar) {
  // TODO: 实现查看模型详情的逻辑
  console.log('View model:', model);
}

// 获取就绪状态的模型列表
async function fetchReadyModels() {
  try {
    const models = await getAvatars();
    if (Array.isArray(models)) {
      readyModels.value = models.filter((model) => model.status === 'ready');
    } else {
      console.error('Invalid models data:', models);
      readyModels.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch models:', error);
    readyModels.value = [];
  }
}

onMounted(async () => {
  try {
    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await fetchReadyModels();
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use 'sass:color';

.user-model-gallery {
  max-width: 1200px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.gallery-header {
  margin-bottom: 24px;
}

.gallery-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;

  .tip-icon {
    font-style: normal;
  }
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

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.model-preview {
  width: 100%;
  height: 200px;
  background: #f8f9fa;
  overflow: hidden;
}

.model-info {
  padding: 16px;

  h3 {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 1.1rem;
  }

  p {
    margin: 0 0 12px 0;
    color: #6c757d;
    font-size: 0.9rem;
    line-height: 1.4;
  }
}

.model-meta {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 16px;
}

.view-btn {
  width: 100%;
  padding: 8px 16px;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: color.adjust($primary-color, $lightness: -10%);
  }
}
</style>
