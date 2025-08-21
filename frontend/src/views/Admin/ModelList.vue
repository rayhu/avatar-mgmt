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
        <button class="action-btn" @click="openUploadModal">
          {{ t('modelManagement.uploadModel') }}
        </button>
      </div>

      <div v-if="avatars.length > 0" class="model-list">
        <div v-for="model in avatars" :key="model.id" class="model-item">
          <div class="model-preview">
            <ModelCard :preview-url="model.previewUrl" />
          </div>
          <div class="model-info">
            <h3>{{ model.name }}</h3>
            <p>{{ model.description }}</p>
            <div class="model-meta">
              <span
                >{{ t('modelManagement.modelInfo.status') }}:
                {{ t(`modelManagement.modelStatus.${model.status.toLowerCase()}`) }}</span
              >
              <span
                >{{ t('modelManagement.modelInfo.version') }}: {{ model.version || 'N/A' }}</span
              >
              <span
                >{{ t('modelManagement.modelInfo.createTime') }}:
                {{ formatDate(model.createTime) }}</span
              >
            </div>
          </div>
          <div class="model-actions model-item-actions">
            <button class="action-btn" @click="editModel(model)">
              {{ t('modelManagement.editModel') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>{{ t('common.error') }}</h3>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button class="action-btn primary" @click="fetchAllModels">
            {{ t('common.retry') }}
          </button>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>{{ t('common.noData') }}</h3>
        <p>{{ t('modelManagement.noModelsDescription') }}</p>
        <div class="empty-actions">
          <button class="action-btn outline" @click="fetchAllModels">
            {{ t('common.refresh') }}
          </button>
          <button class="action-btn primary" @click="openUploadModal">
            {{ t('modelManagement.uploadModel') }}
          </button>
        </div>
      </div>
    </template>

    <!-- 编辑模型对话框 -->
    <EditAvatarModal
      :is-visible="isEditModalVisible"
      :avatar="editingAvatar"
      @close="closeEditModal"
      @updated="handleAvatarUpdated"
    />

    <!-- 上传模型对话框 -->
    <UploadAvatarModal
      :is-visible="isUploadModalVisible"
      @close="closeUploadModal"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Avatar } from '../../types/avatar';
import { getAvatars } from '../../api/avatars';
import UploadAvatarModal from '../../components/UploadAvatarModal.vue';
import EditAvatarModal from '../../components/EditAvatarModal.vue';
import ModelCard from '../../components/ModelCard.vue';
import ModelListSkeleton from '../../components/ModelListSkeleton.vue';

const { t } = useI18n();

const avatars = ref<Avatar[]>([]);
const loading = ref(true);
const error = ref<string>('');
const isEditModalVisible = ref(false);
const editingAvatar = ref<Avatar | null>(null);
const isUploadModalVisible = ref(false);

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleString();
}

// 获取所有模型列表
async function fetchAllModels() {
  try {
    error.value = '';
    const models = await getAvatars(); // 包含已删除的模型

    if (Array.isArray(models)) {
      avatars.value = models;
    } else {
      console.error('Invalid models data:', models);
      avatars.value = [];
      error.value = 'Invalid data format received from server';
    }
  } catch (err) {
    console.error('Failed to fetch models:', err);
    avatars.value = [];
    error.value = err instanceof Error ? err.message : 'Failed to load models';
  }
}

// 编辑模型
function editModel(avatar: Avatar) {
  editingAvatar.value = avatar;
  isEditModalVisible.value = true;
}

// 删除模型
function deleteModel(avatar: Avatar) {
  if (confirm(t('common.confirmDelete', { name: avatar.name }))) {
    // TODO: 实现删除功能
    console.log('删除模型:', avatar);
  }
}

// 关闭编辑对话框
function closeEditModal() {
  isEditModalVisible.value = false;
  editingAvatar.value = null;
}

// 打开上传对话框
function openUploadModal() {
  isUploadModalVisible.value = true;
}

// 关闭上传对话框
function closeUploadModal() {
  isUploadModalVisible.value = false;
}

// 处理模型更新
function handleAvatarUpdated(updatedAvatar: Avatar) {
  const index = avatars.value.findIndex(a => a.id === updatedAvatar.id);
  if (index !== -1) {
    // 如果模型被标记为删除，从列表中移除
    if (updatedAvatar.status === 'deleted') {
      avatars.value.splice(index, 1);
    } else {
      // 否则更新列表中的模型数据
      avatars.value[index] = updatedAvatar;
    }
  }
}

// 处理上传成功
function handleUploadSuccess(newAvatar: Avatar) {
  // 将新模型添加到列表开头
  avatars.value.unshift(newAvatar);
  // 刷新列表
  fetchAllModels();
}

onMounted(async () => {
  try {
    // 模拟API调用延迟
    await fetchAllModels();
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use 'sass:color';

.admin-model-list {
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

  // 移动端适配
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 4px;
    padding: 10px 12px;
    font-size: 0.85rem;
  }
}

.model-actions {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;

  // 移动端适配
  @media (max-width: 768px) {
    margin-bottom: 16px;

    .action-btn {
      flex: 1;
    }
  }
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: $primary-color;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px;
  font-size: 14px;

  &:hover {
    background: color.adjust($primary-color, $lightness: -10%);
  }

  &.danger {
    background: #dc3545;
    &:hover {
      background: color.adjust(#dc3545, $lightness: -10%);
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 16px;
    min-height: 48px;
    flex: 1;
  }

  &:active {
    transform: scale(0.98);
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
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  // 移动端垂直布局
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px;
  }
}

.model-preview {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 20px;
  flex-shrink: 0;

  :deep(.model-card) {
    width: 100%;
    height: 100%;
  }

  // 移动端适配
  @media (max-width: 768px) {
    align-self: center;
    margin-right: 0;
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    width: 100px;
    height: 100px;
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

  // 移动端适配
  @media (max-width: 768px) {
    text-align: center;

    h3 {
      font-size: 1.2rem;
      margin-bottom: 8px;
    }

    p {
      font-size: 0.95rem;
      line-height: 1.4;
    }
  }
}

.model-meta {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #6c757d;

  // 移动端适配
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    font-size: 0.85rem;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }
}

// 模型项目中的按钮组（区别于顶部的按钮组）
.model-item-actions {
  @media (max-width: 768px) {
    display: flex;
    gap: 12px;
    width: 100%;
    margin-top: 8px;

    .action-btn {
      flex: 1;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    gap: 8px;

    .action-btn {
      padding: 10px 16px;
      font-size: 15px;
    }
  }
}

// 空状态和错误状态样式
.empty-state,
.error-state {
  text-align: center;
  padding: 60px 40px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;

  @media (max-width: 768px) {
    padding: 40px 20px;
    margin-top: 16px;
  }

  .empty-icon,
  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;

    @media (max-width: 768px) {
      font-size: 40px;
      margin-bottom: 12px;
    }
  }

  h3,
  h4 {
    margin: 0 0 12px 0;
    color: #2c3e50;
    font-size: 1.3rem;

    @media (max-width: 768px) {
      font-size: 1.2rem;
    }
  }

  p {
    margin: 0 0 24px 0;
    color: #6c757d;
    line-height: 1.5;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;

    @media (max-width: 768px) {
      font-size: 0.95rem;
      margin-bottom: 20px;
    }
  }

  .empty-actions,
  .error-actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    justify-content: center;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;

      .action-btn {
        min-width: 200px;
      }
    }

    .action-btn {
      min-width: 120px;
    }
  }
}

.error-state {
  .error-icon {
    color: #dc3545;
  }

  h3,
  h4 {
    color: #dc3545;
  }
}

// 为 action-btn 添加更多样式变体
.action-btn {
  &.primary {
    background: $primary-color;
    color: white;

    &:hover {
      background: color.adjust($primary-color, $lightness: -10%);
    }
  }

  &.outline {
    background: transparent;
    color: $primary-color;
    border: 1px solid $primary-color;

    &:hover {
      background: $primary-color;
      color: white;
    }
  }
}
</style>
