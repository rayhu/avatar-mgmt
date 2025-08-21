<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ t('modelManagement.uploadModel') }}</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <form @submit.prevent="handleSubmit" class="upload-form">
        <div class="form-group">
          <label for="name">{{ t('modelManagement.modelInfo.name') }} *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            :placeholder="t('modelManagement.placeholders.name')"
          />
        </div>

        <div class="form-group">
          <label for="description">{{ t('modelManagement.modelInfo.description') }}</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="3"
            :placeholder="t('modelManagement.placeholders.description')"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="purpose">{{ t('modelManagement.modelInfo.purpose') }}</label>
            <select id="purpose" v-model="formData.purpose">
              <option value="">{{ t('modelManagement.placeholders.selectPurpose') }}</option>
              <option value="客服">{{ t('modelManagement.purpose.service') }}</option>
              <option value="品牌">{{ t('modelManagement.purpose.brand') }}</option>
              <option value="主持人">{{ t('modelManagement.purpose.host') }}</option>
              <option value="AI助手">{{ t('modelManagement.purpose.assistant') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="style">{{ t('modelManagement.modelInfo.style') }}</label>
            <select id="style" v-model="formData.style">
              <option value="">{{ t('modelManagement.placeholders.selectStyle') }}</option>
              <option value="卡通">{{ t('modelManagement.style.cartoon') }}</option>
              <option value="写实">{{ t('modelManagement.style.realistic') }}</option>
              <option value="未来感">{{ t('modelManagement.style.futuristic') }}</option>
              <option value="国风">{{ t('modelManagement.style.chinese') }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="tags">{{ t('modelManagement.modelInfo.tags') }}</label>
          <input
            id="tags"
            v-model="tagsInput"
            type="text"
            :placeholder="t('modelManagement.placeholders.tags')"
            @keydown.enter.prevent="addTag"
          />
          <div v-if="formData.tags.length > 0" class="tags-list">
            <span v-for="tag in formData.tags" :key="tag" class="tag">
              {{ tag }}
              <button type="button" @click="removeTag(tag)">×</button>
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="version">{{ t('modelManagement.modelInfo.version') }}</label>
          <input
            id="version"
            v-model="formData.version"
            type="text"
            placeholder="1.0.0"
            pattern="^\d+\.\d+\.\d+$"
          />
        </div>

        <div class="form-group file-upload-group">
          <label>{{ t('modelManagement.modelInfo.glbFile') }} *</label>
          <div
            class="file-upload-area"
            :class="{ 'drag-over': isDragOver }"
            @drop="handleDrop"
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @click="triggerFileInput"
          >
            <input
              ref="glbFileInput"
              type="file"
              accept=".glb,.gltf"
              @change="handleGlbFileChange"
              style="display: none"
            />
            <div v-if="!formData.glbFile" class="upload-placeholder">
              <div class="upload-icon">📁</div>
              <p>{{ t('modelManagement.uploadPlaceholder.glb') }}</p>
              <p class="upload-hint">{{ t('modelManagement.uploadHint.glb') }}</p>
            </div>
            <div v-else class="file-info">
              <div class="file-icon">📄</div>
              <div class="file-details">
                <p class="file-name">{{ formData.glbFile.name }}</p>
                <p class="file-size">{{ formatFileSize(formData.glbFile.size) }}</p>
              </div>
              <button type="button" @click.stop="removeGlbFile" class="remove-file">×</button>
            </div>
          </div>
        </div>

        <div class="form-group file-upload-group">
          <label>{{ t('modelManagement.modelInfo.preview') }}</label>
          <div
            class="file-upload-area"
            :class="{ 'drag-over': isPreviewDragOver }"
            @drop="handlePreviewDrop"
            @dragover.prevent="isPreviewDragOver = true"
            @dragleave="isPreviewDragOver = false"
            @click="triggerPreviewInput"
          >
            <input
              ref="previewFileInput"
              type="file"
              accept="image/*"
              @change="handlePreviewFileChange"
              style="display: none"
            />
            <div v-if="!formData.previewFile" class="upload-placeholder">
              <div class="upload-icon">🖼️</div>
              <p>{{ t('modelManagement.uploadPlaceholder.preview') }}</p>
              <p class="upload-hint">{{ t('modelManagement.uploadHint.preview') }}</p>
            </div>
            <div v-else class="file-info preview-info">
              <img :src="previewImageUrl" alt="Preview" class="preview-image" />
              <div class="file-details">
                <p class="file-name">{{ formData.previewFile.name }}</p>
                <p class="file-size">{{ formatFileSize(formData.previewFile.size) }}</p>
              </div>
              <button type="button" @click.stop="removePreviewFile" class="remove-file">×</button>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeModal" class="btn-cancel">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" :disabled="!isFormValid || isUploading" class="btn-submit">
            <span v-if="isUploading">{{ t('modelManagement.uploading') }}...</span>
            <span v-else>{{ t('common.submit') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { uploadAvatar } from '../api/avatars';

const { t } = useI18n();

interface Props {
  isVisible: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'upload-success', data: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Form data
const formData = ref({
  name: '',
  description: '',
  purpose: '',
  style: '',
  tags: [] as string[],
  version: '1.0.0',
  glbFile: null as File | null,
  previewFile: null as File | null,
});

// UI state
const isUploading = ref(false);
const isDragOver = ref(false);
const isPreviewDragOver = ref(false);
const tagsInput = ref('');
const previewImageUrl = ref('');
const errorMessage = ref('');

// File input refs
const glbFileInput = ref<HTMLInputElement>();
const previewFileInput = ref<HTMLInputElement>();

// Computed
const isFormValid = computed(() => {
  return formData.value.name.trim() && formData.value.glbFile;
});

// Methods
function closeModal() {
  if (!isUploading.value) {
    resetForm();
    emit('close');
  }
}

function handleOverlayClick(event: Event) {
  if (event.target === event.currentTarget) {
    closeModal();
  }
}

function resetForm() {
  formData.value = {
    name: '',
    description: '',
    purpose: '',
    style: '',
    tags: [],
    version: '1.0.0',
    glbFile: null,
    previewFile: null,
  };
  tagsInput.value = '';
  previewImageUrl.value = '';
  isDragOver.value = false;
  isPreviewDragOver.value = false;
  errorMessage.value = '';
}

// Tag management
function addTag() {
  const tag = tagsInput.value.trim();
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag);
    tagsInput.value = '';
  }
}

function removeTag(tag: string) {
  const index = formData.value.tags.indexOf(tag);
  if (index > -1) {
    formData.value.tags.splice(index, 1);
  }
}

// File handling
function triggerFileInput() {
  glbFileInput.value?.click();
}

function triggerPreviewInput() {
  previewFileInput.value?.click();
}

function handleGlbFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && isValidGlbFile(file)) {
    formData.value.glbFile = file;
  }
}

function handlePreviewFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && isValidImageFile(file)) {
    formData.value.previewFile = file;
    createPreviewUrl(file);
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (isValidGlbFile(file)) {
      formData.value.glbFile = file;
    }
  }
}

function handlePreviewDrop(event: DragEvent) {
  event.preventDefault();
  isPreviewDragOver.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (isValidImageFile(file)) {
      formData.value.previewFile = file;
      createPreviewUrl(file);
    }
  }
}

function removeGlbFile() {
  formData.value.glbFile = null;
  if (glbFileInput.value) {
    glbFileInput.value.value = '';
  }
}

function removePreviewFile() {
  formData.value.previewFile = null;
  previewImageUrl.value = '';
  if (previewFileInput.value) {
    previewFileInput.value.value = '';
  }
}

function isValidGlbFile(file: File): boolean {
  const validTypes = ['model/gltf-binary', 'application/octet-stream'];
  const validExtensions = ['.glb', '.gltf'];

  return (
    validTypes.includes(file.type) ||
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  );
}

function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function createPreviewUrl(file: File) {
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value);
  }
  previewImageUrl.value = URL.createObjectURL(file);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function handleSubmit() {
  if (!isFormValid.value || isUploading.value) return;

  isUploading.value = true;

  try {
    const formDataToSend = new FormData();

    // Add text fields
    formDataToSend.append('name', formData.value.name);
    formDataToSend.append('description', formData.value.description);
    formDataToSend.append('purpose', formData.value.purpose);
    formDataToSend.append('style', formData.value.style);
    formDataToSend.append('version', formData.value.version);
    formDataToSend.append('tags', JSON.stringify(formData.value.tags));

    // Add files
    if (formData.value.glbFile) {
      formDataToSend.append('glbFile', formData.value.glbFile);
    }
    if (formData.value.previewFile) {
      formDataToSend.append('previewFile', formData.value.previewFile);
    }

    // Make API call using the avatars API
    const result = await uploadAvatar(formDataToSend);

    // Reset uploading state before closing modal
    isUploading.value = false;

    // Emit success and close modal
    emit('upload-success', result);
    resetForm();
    emit('close');
  } catch (error) {
    console.error('Upload failed:', error);
    errorMessage.value = error instanceof Error ? error.message : '上传失败，请重试';
    isUploading.value = false;
  }
}

// Cleanup preview URL on unmount
watch(
  () => props.isVisible,
  visible => {
    if (!visible && previewImageUrl.value) {
      URL.revokeObjectURL(previewImageUrl.value);
      previewImageUrl.value = '';
    }
  }
);
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;

  h3 {
    margin: 0;
    color: #2c3e50;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6c757d;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #495057;
    }
  }
}

.upload-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #2c3e50;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
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

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.tags-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  button {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #495057;
    }
  }
}

.file-upload-group {
  .file-upload-area {
    border: 2px dashed #ced4da;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover,
    &.drag-over {
      border-color: $primary-color;
      background: rgba($primary-color, 0.05);
    }

    .upload-placeholder {
      .upload-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      p {
        margin: 4px 0;
        color: #495057;

        &.upload-hint {
          font-size: 12px;
          color: #6c757d;
        }
      }
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      &.preview-info {
        justify-content: space-between;
      }

      .file-icon {
        font-size: 24px;
      }

      .preview-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }

      .file-details {
        flex: 1;
        text-align: left;

        .file-name {
          margin: 0 0 4px 0;
          font-weight: 500;
          word-break: break-all;
        }

        .file-size {
          margin: 0;
          font-size: 12px;
          color: #6c757d;
        }
      }

      .remove-file {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: #c82333;
        }
      }
    }
  }
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  border: 1px solid #f5c6cb;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  margin-top: 20px;

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;

    &.btn-cancel {
      background: #6c757d;
      color: white;

      &:hover {
        background: #545b62;
      }
    }

    &.btn-submit {
      background: $primary-color;
      color: white;

      &:hover:not(:disabled) {
        background: darken($primary-color, 10%);
      }

      &:disabled {
        background: #ced4da;
        cursor: not-allowed;
      }
    }
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-header,
  .upload-form {
    padding: 16px;
  }

  .modal-actions {
    flex-direction: column;

    button {
      width: 100%;
      padding: 12px;
    }
  }
}
</style>
