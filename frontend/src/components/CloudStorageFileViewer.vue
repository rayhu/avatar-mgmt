<template>
  <div class="cloud-storage-file-viewer">
    <!-- 文件信息显示 -->
    <div v-if="fileInfo" class="file-info">
      <h3>{{ fileInfo.fileName }}</h3>
      <div class="file-details">
        <p><strong>文件大小:</strong> {{ formatFileSize(fileInfo.fileSize) }}</p>
        <p><strong>类型:</strong> {{ fileInfo.mimeType }}</p>
        <p><strong>上传时间:</strong> {{ formatDate(fileInfo.uploadTime) }}</p>
      </div>
    </div>

    <!-- 文件预览 -->
    <div v-if="signedUrl" class="file-preview">
      <!-- 图片预览 -->
      <img
        v-if="isImageFile"
        :src="signedUrl"
        :alt="fileInfo?.fileName || '文件预览'"
        class="image-preview"
        @error="handleImageError"
      />

      <!-- 3D模型预览 -->
      <div v-else-if="is3DModelFile" class="model-preview">
        <p>3D模型文件: {{ fileInfo?.fileName }}</p>
        <a :href="signedUrl" download class="download-btn">
          <i class="fas fa-download"></i> 下载模型
        </a>
      </div>

      <!-- 其他文件类型 -->
      <div v-else class="other-file">
        <p>文件类型: {{ fileInfo?.mimeType }}</p>
        <a :href="signedUrl" download class="download-btn">
          <i class="fas fa-download"></i> 下载文件
        </a>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在生成访问链接...</p>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error">
      <p class="error-message">{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <!-- 刷新按钮 -->
    <div v-if="signedUrl && !loading" class="actions">
      <button @click="refreshSignedUrl" class="refresh-btn">
        <i class="fas fa-refresh"></i> 刷新链接
      </button>
      <p class="expiry-info">链接将在 {{ formatTimeRemaining() }} 后过期</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/store';

// 定义组件属性
interface Props {
  fileId: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  expiresIn?: number; // 过期时间（秒）
  autoRefresh?: boolean; // 是否自动刷新
}

const props = withDefaults(defineProps<Props>(), {
  fileName: '',
  fileSize: 0,
  mimeType: '',
  expiresIn: 3600,
  autoRefresh: true,
});

// 响应式数据
const fileInfo = ref<any>(null);
const signedUrl = ref<string>('');
const loading = ref(false);
const error = ref<string>('');
const expiryTime = ref<Date | null>(null);
const refreshTimer = ref<number | null>(null);

// 使用认证组合式函数
const authStore = useAuthStore();

// 计算属性
const isImageFile = computed(() => {
  if (!fileInfo.value?.mimeType) return false;
  return fileInfo.value.mimeType.startsWith('image/');
});

const is3DModelFile = computed(() => {
  if (!fileInfo.value?.mimeType) return false;
  return (
    fileInfo.value.mimeType.includes('gltf') ||
    fileInfo.value.mimeType.includes('glb') ||
    fileInfo.value.fileName?.endsWith('.glb') ||
    fileInfo.value.fileName?.endsWith('.gltf')
  );
});

// 方法
const generateSignedUrl = async () => {
  if (!props.fileId) {
    error.value = '文件ID不能为空';
    return;
  }

  if (!authStore.token) {
    error.value = '未登录或token已过期';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(
      `/api/cloud-storage/signed-url/${props.fileId}?expiresIn=${props.expiresIn}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      signedUrl.value = data.data.signedUrl;
      expiryTime.value = new Date(data.data.expiresAt);

      // 设置自动刷新定时器
      if (props.autoRefresh) {
        setupAutoRefresh();
      }

      // 获取文件信息
      await getFileInfo();
    } else {
      throw new Error(data.error || '生成签名URL失败');
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '未知错误';
    console.error('Failed to generate signed URL:', err);
  } finally {
    loading.value = false;
  }
};

const getFileInfo = async () => {
  if (!authStore.token) {
    console.warn('No token available for file info request');
    return;
  }

  try {
    const response = await fetch(`/api/cloud-storage/${props.fileId}/info`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        fileInfo.value = data.data;
      }
    }
  } catch (err) {
    console.warn('Failed to get file info:', err);
    // 使用props中的信息作为后备
    if (props.fileName || props.fileSize || props.mimeType) {
      fileInfo.value = {
        fileName: props.fileName,
        fileSize: props.fileSize,
        mimeType: props.mimeType,
        uploadTime: new Date(),
      };
    }
  }
};

const refreshSignedUrl = async () => {
  await generateSignedUrl();
};

const retry = async () => {
  await generateSignedUrl();
};

const setupAutoRefresh = () => {
  if (refreshTimer.value) {
    clearTimeout(refreshTimer.value);
  }

  // 在过期前5分钟刷新
  const refreshDelay = Math.max((props.expiresIn - 300) * 1000, 60000); // 最少1分钟

  refreshTimer.value = window.setTimeout(() => {
    if (props.autoRefresh) {
      refreshSignedUrl();
    }
  }, refreshDelay);
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '未知';

  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (date: Date | string): string => {
  if (!date) return '未知';

  const d = new Date(date);
  return d.toLocaleString('zh-CN');
};

const formatTimeRemaining = (): string => {
  if (!expiryTime.value) return '未知';

  const now = new Date();
  const diff = expiryTime.value.getTime() - now.getTime();

  if (diff <= 0) return '已过期';

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  } else {
    return `${seconds}秒`;
  }
};

const handleImageError = () => {
  error.value = '图片加载失败';
};

// 生命周期
onMounted(() => {
  generateSignedUrl();
});

onUnmounted(() => {
  if (refreshTimer.value) {
    clearTimeout(refreshTimer.value);
  }
});
</script>

<style scoped lang="scss">
.cloud-storage-file-viewer {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  max-width: 100%;
}

.file-info {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.2rem;
  }

  .file-details {
    p {
      margin: 0.25rem 0;
      color: #666;
      font-size: 0.9rem;
    }
  }
}

.file-preview {
  margin: 1rem 0;
  text-align: center;

  .image-preview {
    max-width: 100%;
    max-height: 400px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .model-preview,
  .other-file {
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 4px;
    border: 2px dashed #dee2e6;

    p {
      margin: 0 0 1rem 0;
      color: #666;
    }
  }
}

.loading {
  text-align: center;
  padding: 2rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  p {
    color: #666;
    margin: 0;
  }
}

.error {
  text-align: center;
  padding: 1rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 4px;
  margin: 1rem 0;

  .error-message {
    color: #c53030;
    margin: 0 0 1rem 0;
  }
}

.actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
  text-align: center;

  .refresh-btn {
    background: #4299e1;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;

    &:hover {
      background: #3182ce;
    }

    i {
      margin-right: 0.5rem;
    }
  }

  .expiry-info {
    margin: 0.5rem 0 0 0;
    font-size: 0.8rem;
    color: #666;
  }
}

.download-btn {
  display: inline-block;
  background: #48bb78;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background: #38a169;
  }

  i {
    margin-right: 0.5rem;
  }
}

.retry-btn {
  background: #ed8936;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background: #dd6b20;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .cloud-storage-file-viewer {
    padding: 0.5rem;
  }

  .file-preview .image-preview {
    max-height: 300px;
  }

  .actions .refresh-btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
