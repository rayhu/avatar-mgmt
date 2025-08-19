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
                >{{ t('modelManagement.modelInfo.version') }}: {{ model.version || 'N/A' }}</span
              >
            </div>
            <div class="model-actions">
              <button class="action-btn primary" @click="createAnimation(model)">
                {{ t('animate.title') }}
              </button>
              <button class="action-btn secondary" @click="testModel(model)">
                {{ t('test.title') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store';
// ModelGallerySkeleton 和 ModelCard 已自动导入
import type { Avatar } from '../../types/avatar';
import { getAvatars } from '../../api/avatars';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const readyModels = ref<Avatar[]>([]);
const loading = ref(true);

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleString();
}

// 创建语音动画
function createAnimation(model: Avatar) {
  console.log('创建动画:', model);
  // 跳转到动画创建页面，并传递选中的模型信息
  router.push({
    name: 'animate',
    query: { modelId: model.id, modelName: model.name },
  });
}

// 测试模型（仅管理员）
function testModel(model: Avatar) {
  console.log('测试模型:', model);
  // 跳转到模型测试页面，并传递选中的模型信息
  router.push({
    name: 'test',
    query: { modelId: model.id, modelName: model.name },
  });
}

// 查看模型详情
function viewModel(model: Avatar) {
  console.log('查看模型:', model);
  // TODO: 实现模型详情查看功能，可以考虑使用模态框或单独页面
}

// 获取就绪状态的模型列表
async function fetchReadyModels() {
  try {
    const models = await getAvatars();
    if (Array.isArray(models)) {
      readyModels.value = models.filter(model => model.status === 'ready');
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
    await new Promise(resolve => setTimeout(resolve, 1500));
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

  // 移动端适配
  @media (max-width: 768px) {
    margin: 20px 16px;
    padding: 20px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    margin: 16px 8px;
    padding: 16px;
  }
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

  // 移动端适配
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 16px;
  }
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
  flex: 1;
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 12px 0;
    color: #2c3e50;
    font-size: 1.2rem;
    font-weight: 600;
  }
}

.model-description {
  margin-bottom: 16px;

  p {
    margin: 0;
    color: #495057;
    font-size: 0.95rem;
    line-height: 1.6;
    text-align: justify;
    word-break: break-word;
    hyphens: auto;
    max-height: 120px;
    overflow-y: auto;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;

      &:hover {
        background: #a8a8a8;
      }
    }
  }
}

.model-meta {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid $primary-color;
}

.model-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;

  @media (max-width: 480px) {
    gap: 12px;
  }
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  min-height: 44px;
  font-size: 14px;

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 16px;
    min-height: 48px;
  }

  &.primary {
    background: $primary-color;
    color: white;

    &:hover {
      background: color.adjust($primary-color, $lightness: -10%);
      transform: translateY(-1px);
    }
  }

  &.secondary {
    background: #6c757d;
    color: white;

    &:hover {
      background: color.adjust(#6c757d, $lightness: -10%);
      transform: translateY(-1px);
    }
  }

  &.outline {
    background: transparent;
    color: $primary-color;
    border: 1px solid $primary-color;

    &:hover {
      background: $primary-color;
      color: white;
      transform: translateY(-1px);
    }
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
