<template>
  <div class="admin-model-list">
    <ModelListSkeleton v-if="loading" />
    <template v-else>
      <div class="list-header">
        <h2>{{ t('modelManagement.title') }}</h2>
        <div class="list-tip">
          <i class="tip-icon">ℹ️</i>
          <span>{{ t('modelManagement.listTip') }}</span>
        </div>
      </div>
      <div class="model-actions">
        <button class="action-btn">{{ t('modelManagement.uploadModel') }}</button>
      </div>
      <div class="model-list">
        <div v-for="model in models" :key="model.id" class="model-item">
          <div class="model-info">
            <h3>{{ model.name }}</h3>
            <p>{{ model.description }}</p>
            <div class="model-meta">
              <span>{{ t('modelManagement.modelInfo.status') }}: {{ t(`modelManagement.modelStatus.${model.status.toLowerCase()}`) }}</span>
              <span>{{ t('modelManagement.modelInfo.createTime') }}: {{ formatDate(model.createTime) }}</span>
            </div>
          </div>
          <div class="model-actions">
            <button class="action-btn">{{ t('modelManagement.editModel') }}</button>
            <button class="action-btn danger">{{ t('modelManagement.deleteModel') }}</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelListSkeleton from '@/components/ModelListSkeleton.vue';
import type { Model } from '@/types/model';

const { t } = useI18n();

const models = ref<Model[]>([]);
const loading = ref(true);

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

onMounted(async () => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    // TODO: 实际API调用
    models.value = [
      {
        id: '1',
        name: '测试模型1',
        description: '这是一个测试模型',
        status: 'ready',
        createTime: new Date().toISOString()
      },
      {
        id: '2',
        name: '测试模型2',
        description: '这是另一个测试模型',
        status: 'draft',
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

.admin-model-list {
  max-width: 1200px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.list-header {
  margin-bottom: 24px;
}

.list-tip {
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

.model-actions {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: $primary-color;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: darken($primary-color, 10%);
  }

  &.danger {
    background: #dc3545;
    &:hover {
      background: darken(#dc3545, 10%);
    }
  }
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  }
}

.model-info {
  flex: 1;

  h3 {
    margin: 0 0 8px 0;
    color: #2c3e50;
  }

  p {
    margin: 0 0 12px 0;
    color: #6c757d;
  }
}

.model-meta {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #6c757d;
}
</style> 