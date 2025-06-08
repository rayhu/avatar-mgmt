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
            <img :src="model.previewUrl" :alt="model.name" />
          </div>
          <div class="model-info">
            <h3>{{ model.name }}</h3>
            <p>{{ model.description }}</p>
            <div class="model-meta">
              <span>{{ t('modelManagement.modelInfo.createTime') }}: {{ formatDate(model.createTime) }}</span>
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
import ModelGallerySkeleton from '@/components/ModelGallerySkeleton.vue';

const { t } = useI18n();

interface Model {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  createTime: string;
}

const readyModels = ref<Model[]>([]);
const loading = ref(true);

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function viewModel(model: Model) {
  // TODO: 实现查看模型详情的逻辑
  console.log('View model:', model);
}

onMounted(async () => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    // TODO: 实际API调用
    readyModels.value = [
      {
        id: '1',
        name: '测试模型1',
        description: '这是一个测试模型',
        previewUrl: 'https://via.placeholder.com/300x200',
        createTime: new Date().toISOString()
      },
      {
        id: '2',
        name: '测试模型2',
        description: '这是另一个测试模型',
        previewUrl: 'https://via.placeholder.com/300x200',
        createTime: new Date().toISOString()
      }
    ];
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.user-model-gallery {
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
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
}

.model-preview {
  width: 100%;
  height: 200px;
  background: #f8f9fa;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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
    background: darken($primary-color, 10%);
  }
}
</style> 