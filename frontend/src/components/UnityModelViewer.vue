<template>
  <div ref="container" class="unity-model-viewer">
    <!-- 加载状态覆盖层 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">
          <h3>{{ t('modelViewer.loading.title') }}</h3>
          <p>{{ t('modelViewer.loading.subtitle') }}</p>
          <div class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ Math.round(loadingProgress) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态覆盖层 -->
    <div v-if="loadError" class="error-overlay">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>{{ t('modelViewer.error.title') }}</h3>
        <p>{{ loadError }}</p>
        <button class="retry-btn" @click="retryLoad">
          {{ t('common.retry') }}
        </button>
      </div>
    </div>

    <!-- DOM 背景层（当 Unity 透明时可见） -->
    <div
      v-if="domBackgroundImage"
      class="unity-bg"
      :style="{ backgroundImage: `url(${domBackgroundImage})` }"
    ></div>

    <!-- Unity WebGL iframe -->
    <iframe
      v-show="!isLoading && !loadError"
      ref="unityFrame"
      class="unity-iframe"
      id="Frame"
      :src="modelUrl"
      title="AI-Chat-Toolkit"
      referrerpolicy="no-referrer"
      loading="eager"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props - 保持与原 ModelViewer 相同的接口
const props = defineProps<{
  modelUrl?: string;
  emotion?: string;
  action?: string;
  autoRotate?: boolean;
  showControls?: boolean;
  avatarId?: string; // 新增：数字人 ID
}>();

// Template refs
const container = ref<HTMLElement | null>(null);
const unityFrame = ref<HTMLIFrameElement | null>(null);

// 状态管理
const isLoading = ref(false);
const loadingProgress = ref(0);
const loadError = ref<string | null>(null);
const isUnityReady = ref(false);
const currentAvatarId = ref<string | null>(null);
const currentUnityUrl = ref<string | null>(null);

// DOM 背景（Track A：不改 Unity，使用容器下层背景）
const domBackgroundImage = ref<string | null>(null);

// 消息队列 - 在 Unity 未就绪时缓存消息
const messageQueue = ref<Array<{ kind: string; msg: any }>>([]);

// 计算当前 Unity WebGL URL
const unityUrl = computed(() => {
  if (!props.avatarId) return null;
  // 根据不同的 avatarId 返回不同的 Unity 构建路径
  return `/unity_sample/index.html?avatarId=${props.avatarId}`;
});

// Unity 就绪状态监听器
function handleUnityReady(event: MessageEvent) {
  // 验证消息来源
  if (!isValidOrigin(event.origin)) {
    console.warn('🚫 Invalid origin for Unity ready message:', event.origin);
    return;
  }

  if (event.data?.type === 'unity-ready') {
    const { avatarId } = event.data;
    console.log('🎮 Unity WebGL ready for avatar:', avatarId);

    isUnityReady.value = true;
    currentAvatarId.value = avatarId;
    isLoading.value = false;
    loadingProgress.value = 100;

    // 处理消息队列
    flushMessageQueue();

    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent('unity-avatar-ready', {
        detail: { avatarId },
      })
    );
  }
}

// Unity 进度更新监听器
function handleUnityProgress(event: MessageEvent) {
  if (!isValidOrigin(event.origin)) return;

  if (event.data?.type === 'unity-progress') {
    const { progress } = event.data;
    loadingProgress.value = Math.round(progress * 100);
  }
}

// Unity 错误监听器
function handleUnityError(event: MessageEvent) {
  if (!isValidOrigin(event.origin)) return;

  if (event.data?.type === 'unity-error') {
    const { message } = event.data;
    console.error('❌ Unity WebGL error:', message);
    loadError.value = message;
    isLoading.value = false;
  }
}

// 验证消息来源
function isValidOrigin(origin: string): boolean {
  // 在开发环境允许本地源
  const allowedOrigins = [
    window.location.origin,
    // TODO: 以后需要删除这个
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  return allowedOrigins.includes(origin);
}

// 发送消息到 Unity
function sendToUnity(kind: string, msg: any) {
  if (!isUnityReady.value) {
    // Unity 未就绪，将消息加入队列
    messageQueue.value.push({ kind, msg });
    console.log('📝 Message queued (Unity not ready):', { kind, msg });
    return;
  }

  if (!unityFrame.value?.contentWindow) {
    console.error('❌ Unity iframe not available');
    return;
  }

  const message = { command: 'play_ani', ani_name: msg.ani_name };

  try {
    unityFrame.value.contentWindow.postMessage(JSON.stringify(message), '*'); // 或指定 origin
    console.log('📤 Sent to Unity:', message);
  } catch (error) {
    console.error('❌ Failed to send message to Unity:', error);
  }
}

// 处理消息队列
function flushMessageQueue() {
  if (messageQueue.value.length === 0) return;

  console.log(`📤 Flushing ${messageQueue.value.length} queued messages to Unity`);

  messageQueue.value.forEach(({ kind, msg }) => {
    sendToUnity(kind, msg);
  });

  messageQueue.value = [];
}

// iframe 加载完成处理
function onIframeLoad() {
  console.log('🔗 Unity iframe loaded');
  // iframe 加载完成，但 Unity 还需要初始化时间
}

// 加载/切换 Unity WebGL
async function loadUnityWebGL(avatarId: string) {
  if (currentAvatarId.value === avatarId && isUnityReady.value) {
    console.log('👍 Same avatar already loaded:', avatarId);
    return;
  }

  console.log('🚀 Loading Unity WebGL for avatar:', avatarId);

  // 重置状态
  isLoading.value = true;
  loadingProgress.value = 0;
  loadError.value = null;
  isUnityReady.value = false;
  messageQueue.value = [];

  // 更新 URL，触发 iframe 重新加载
  currentUnityUrl.value = `/unity/index.html?cc=daidai_1`;
}

// 重试加载
function retryLoad() {
  if (props.avatarId) {
    loadError.value = null;
    loadUnityWebGL(props.avatarId);
  }
}

// 播放动画 - 转换为 Unity 消息
function playAnimation(animationName: string, duration?: number, loop: boolean = true) {
  console.log('🎭 UnityModelViewer.playAnimation:', { animationName, duration, loop });

  sendToUnity('play-animation', {
    ani_name: animationName,
    duration,
    loop,
  });
}

// 更新表情 - 转换为 Unity 消息
function updateEmotion(emotion: string, transitionDuration: number = 0.5) {
  console.log('🎭 UnityModelViewer.updateEmotion:', { emotion, transitionDuration });

  sendToUnity('update-emotion', {
    emotion,
    transitionDuration,
  });
}

// 更新音素 - 转换为 Unity 消息
function updateViseme(id: number) {
  console.log('👄 UnityModelViewer.updateViseme:', id);

  sendToUnity('update-viseme', {
    visemeId: id,
  });
}

// 混合表情 - 新功能
function blendEmotions(emotions: { emotion: string; weight: number }[]) {
  console.log('🎭 UnityModelViewer.blendEmotions:', emotions);

  sendToUnity('blend-emotions', {
    emotions,
  });
}

// 设置背景图片
function setBackgroundImage(imageUrl: string) {
  console.log('🖼️ UnityModelViewer.setBackgroundImage:', imageUrl);

  sendToUnity('set-background', {
    imageUrl,
  });
}

// 清除背景图片
function clearBackgroundImage() {
  console.log('🧹 UnityModelViewer.clearBackgroundImage');

  sendToUnity('clear-background', {});
}

// 其他背景控制方法（简化版，实际实现可能需要更多参数）
function adjustBackgroundDistance(distance: number) {
  sendToUnity('adjust-background', { type: 'distance', value: distance });
}

function adjustBackgroundOffset(offset: { x: number; y: number }) {
  sendToUnity('adjust-background', { type: 'offset', value: offset });
}

function adjustBackgroundScale(scale: number) {
  sendToUnity('adjust-background', { type: 'scale', value: scale });
}

function resetBackgroundSettings() {
  sendToUnity('reset-background', {});
}

// 获取可用表情（通过 Unity 请求）
function getAvailableEmotions(): Promise<string[]> {
  return new Promise(resolve => {
    // 发送请求到 Unity
    sendToUnity('get-emotions', {});

    // 监听响应（这里简化处理，实际需要实现消息响应机制）
    // 在真实实现中，你可能需要一个更复杂的请求-响应系统
    setTimeout(() => {
      resolve(['happy', 'sad', 'angry', 'neutral', 'surprised']);
    }, 100);
  });
}

// 获取视频流（Unity WebGL 的特殊处理）
function getVideoStream(frameRate: number = 30): MediaStream | null {
  if (!unityFrame.value?.contentWindow) {
    console.warn('⚠️ Unity iframe not available for video capture');
    return null;
  }

  try {
    // WebGL iframe 视频捕获的实现可能需要额外的设置
    // 这里提供一个基础框架
    const canvas = unityFrame.value.contentWindow.document.querySelector('canvas');
    if (!canvas) {
      console.warn('⚠️ Unity canvas not found');
      return null;
    }

    const clampedFrameRate = Math.max(15, Math.min(60, frameRate));
    return (canvas as HTMLCanvasElement).captureStream(clampedFrameRate);
  } catch (error) {
    console.error('❌ Error capturing Unity video stream:', error);
    return null;
  }
}

// 设置/清除 DOM 背景图（当 Unity 透明时生效）
function setDomBackgroundImage(imageUrl: string) {
  domBackgroundImage.value = imageUrl;
}

function clearDomBackgroundImage() {
  domBackgroundImage.value = null;
}

function sendUnityReadyMessage(avatarId: string) {
  window.postMessage(
    {
      type: 'unity-ready',
      avatarId: avatarId,
    },
    window.origin // 或者 '*'
  );
}

// 监听属性变化
watch(
  () => props.avatarId,
  newAvatarId => {
    if (newAvatarId) {
      loadUnityWebGL(newAvatarId);
    }
  },
  { immediate: true }
);

watch(
  () => props.emotion,
  newEmotion => {
    if (newEmotion) {
      updateEmotion(newEmotion);
    }
  }
);

watch(
  () => props.action,
  newAction => {
    if (newAction) {
      playAnimation(newAction, undefined, true);
    }
  }
);

// 生命周期管理
onMounted(() => {
  // 注册 Unity 消息监听器
  window.addEventListener('message', handleUnityReady);
  window.addEventListener('message', handleUnityProgress);
  window.addEventListener('message', handleUnityError);

  // 处理窗口大小变化
  window.addEventListener('resize', handleResize);

  console.log('🎮 UnityModelViewer mounted');

  // 延迟 3 秒发送Unity提供的示例消息，表示Unity加载完毕
  // TODO: 以后在Unity方面发送一个加载完毕的消息代替这个调用
  setTimeout(() => {
    try {
      if (unityFrame.value?.contentWindow) {
        const msg = { command: 'play_ani', ani_name: 'idle03_DaXiao' };
        unityFrame.value.contentWindow.postMessage(JSON.stringify(msg), '*');
        console.log('Sent test play_ani message to Unity iframe');
        sendUnityReadyMessage('daidai_01');
      } else {
        console.warn('Unity iframe contentWindow not available when sending test message');
      }
    } catch (err) {
      console.error('Failed to send test message to Unity iframe:', err);
    }
  }, 3000);
});

onUnmounted(() => {
  // 清理消息监听器
  window.removeEventListener('message', handleUnityReady);
  window.removeEventListener('message', handleUnityProgress);
  window.removeEventListener('message', handleUnityError);
  window.removeEventListener('resize', handleResize);

  // 清理状态
  isUnityReady.value = false;
  messageQueue.value = [];

  console.log('🧹 UnityModelViewer unmounted');
});

// 处理窗口大小变化
function handleResize() {
  if (!container.value || !unityFrame.value) return;

  // 通知 Unity 调整大小
  sendToUnity('resize', {
    width: container.value.clientWidth,
    height: container.value.clientHeight,
  });
}

// 导出组件接口 - 保持与原 ModelViewer 相同
defineExpose({
  // 动画控制
  playAnimation,
  updateEmotion,
  updateViseme,

  // 表情系统控制
  blendEmotions,
  getAvailableEmotions,
  resetAllEmotionWeights: () => sendToUnity('reset-emotions', {}),

  // 背景控制
  setBackgroundImage,
  clearBackgroundImage,
  adjustBackgroundDistance,
  adjustBackgroundOffset,
  adjustBackgroundScale,
  resetBackgroundSettings,

  // 加载状态
  isLoading,
  loadingProgress,
  loadError,

  // Unity 特有状态
  isUnityReady,
  currentAvatarId,

  // 视频流
  getVideoStream,

  // Unity 通信接口
  sendToUnity,

  // DOM 背景控制（Track A）
  setDomBackgroundImage,
  clearDomBackgroundImage,
});
</script>

<script lang="ts">
export default {
  name: 'UnityModelViewer',
};
</script>

<style scoped>
.unity-model-viewer {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.unity-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.unity-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  display: block;
  position: relative;
  z-index: 1;
}

/* 加载覆盖层 - 复用原有样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  max-width: 300px;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 70%;
  height: 70%;
  top: 15%;
  left: 15%;
  border-top-color: #28a745;
  animation-delay: 0.5s;
}

.spinner-ring:nth-child(3) {
  width: 40%;
  height: 40%;
  top: 30%;
  left: 30%;
  border-top-color: #ffc107;
  animation-delay: 1s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
}

.loading-text p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.loading-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 错误覆盖层 - 复用原有样式 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-content {
  text-align: center;
  max-width: 300px;
  padding: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.error-content h3 {
  margin: 0 0 10px 0;
  color: #dc3545;
  font-size: 18px;
}

.error-content p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #0056b3;
}

.retry-btn:active {
  transform: translateY(1px);
}
</style>
