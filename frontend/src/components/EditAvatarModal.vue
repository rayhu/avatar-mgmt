<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ t('modelManagement.editModel') }}</h3>
        <button class="close-btn" aria-label="关闭" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="name">{{ t('modelManagement.modelInfo.name') }}</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              :placeholder="t('modelManagement.modelInfo.name')"
            />
          </div>

          <div class="form-group">
            <label for="description">{{ t('modelManagement.modelInfo.description') }}</label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              :placeholder="t('modelManagement.modelInfo.description')"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="version">{{ t('modelManagement.modelInfo.version') }}</label>
              <input
                id="version"
                v-model="formData.version"
                type="text"
                pattern="\d+\.\d+\.\d+"
                placeholder="1.0.0"
                title="请使用语义化版本格式，如 1.0.0"
              />
            </div>

            <div class="form-group">
              <label for="status">{{ t('modelManagement.modelInfo.status') }}</label>
              <select id="status" v-model="formData.status" required>
                <option value="draft">{{ t('modelManagement.modelStatus.draft') }}</option>
                <option value="pending">{{ t('modelManagement.modelStatus.pending') }}</option>
                <option value="processing">
                  {{ t('modelManagement.modelStatus.processing') }}
                </option>
                <option value="ready">{{ t('modelManagement.modelStatus.ready') }}</option>
                <option value="error">{{ t('modelManagement.modelStatus.error') }}</option>
                <option value="deleted">{{ t('modelManagement.modelStatus.deleted') }}</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="$emit('close')">
              {{ t('common.cancel') }}
            </button>
            <button
              v-if="props.avatar && props.avatar.status !== 'deleted'"
              type="button"
              class="btn-delete"
              @click="handleMarkAsDeleted"
              :disabled="isLoading"
            >
              {{ t('modelManagement.deleteModel') }}
            </button>
            <button type="submit" class="btn-save" :disabled="isLoading">
              <span v-if="isLoading" class="loading-spinner"></span>
              {{ isLoading ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Avatar } from '../types/avatar';
import { updateAvatarStatus } from '../api/avatar-management';
import { logger } from '../utils/logger';

interface Props {
  isVisible: boolean;
  avatar: Avatar | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'updated', avatar: Avatar): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

const isLoading = ref(false);
const formData = ref<{
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'pending' | 'processing' | 'ready' | 'error' | 'deleted';
}>({
  name: '',
  description: '',
  version: '',
  status: 'draft',
});

// 监听 avatar 变化，更新表单数据
watch(
  () => props.avatar,
  newAvatar => {
    if (newAvatar) {
      formData.value = {
        name: newAvatar.name || '',
        description: newAvatar.description || '',
        version: newAvatar.version || '1.0.0',
        status: newAvatar.status || 'draft',
      };
    }
  },
  { immediate: true }
);

// 处理表单提交
async function handleSubmit() {
  if (!props.avatar) return;

  // 捕获 avatar ID 以防止在异步操作期间 props.avatar 变为 null
  const avatarId = props.avatar.id;

  try {
    isLoading.value = true;

    logger.userAction('编辑模型信息', {
      component: 'EditAvatarModal',
      method: 'handleSubmit',
      avatarId,
      changes: formData.value,
    });

    const updatedAvatar = await updateAvatarStatus(avatarId, formData.value);

    logger.info('模型信息编辑成功', {
      component: 'EditAvatarModal',
      method: 'handleSubmit',
      avatarId,
      updatedAvatar,
    });

    emit('updated', updatedAvatar);
    emit('close');
  } catch (error) {
    console.error('更新模型信息失败:', error);

    logger.error('模型信息编辑失败', {
      component: 'EditAvatarModal',
      method: 'handleSubmit',
      avatarId,
      error: (error as Error).message,
    });

    alert(t('common.error') + ': ' + (error as Error).message);
  } finally {
    isLoading.value = false;
  }
}

// 处理标记为已删除
async function handleMarkAsDeleted() {
  if (!props.avatar) return;

  if (!confirm(t('common.confirmDelete', { name: props.avatar.name }))) {
    return;
  }

  // 捕获 avatar ID 以防止在异步操作期间 props.avatar 变为 null
  const avatarId = props.avatar.id;

  try {
    isLoading.value = true;

    logger.userAction('标记模型为已删除', {
      component: 'EditAvatarModal',
      method: 'handleMarkAsDeleted',
      avatarId,
    });
    logger.info('设置 window.__SHOW_DELETED_AVATARS__ = true 显示已删除模型');

    const updatedAvatar = await updateAvatarStatus(avatarId, { status: 'deleted' });

    logger.info('模型标记为已删除成功', {
      component: 'EditAvatarModal',
      method: 'handleMarkAsDeleted',
      avatarId,
      updatedAvatar,
    });

    emit('updated', updatedAvatar);
    emit('close');
  } catch (error) {
    console.error('标记模型为已删除失败:', error);

    logger.error('标记模型为已删除失败', {
      component: 'EditAvatarModal',
      method: 'handleMarkAsDeleted',
      avatarId,
      error: (error as Error).message,
    });

    alert(t('common.error') + ': ' + (error as Error).message);
  } finally {
    isLoading.value = false;
  }
}

// 处理遮罩层点击
function handleOverlayClick() {
  emit('close');
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.3rem;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #2c3e50;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #4caf50;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;

  @media (max-width: 480px) {
    flex-direction: column;
  }
}

.btn-cancel,
.btn-save,
.btn-delete {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) {
    width: 100%;
  }
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;

  &:hover {
    background: #e8e8e8;
  }
}

.btn-delete {
  background: #dc3545;
  color: white;

  &:hover:not(:disabled) {
    background: #c82333;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
}

.btn-save {
  background: #4caf50;
  color: white;

  &:hover:not(:disabled) {
    background: #45a049;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
