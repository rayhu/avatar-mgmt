<template>
  <div class="animate-page">
    <div class="container">
      <h2>{{ $t('animate.title') }}</h2>
      
      <div class="content">
        <div class="controls">
          <form class="control-form" @submit.prevent="onAnimate">
            <div class="form-group">
              <label for="text">{{ $t('animate.text') }}</label>
              <textarea
                id="text"
                :value="text"
                :placeholder="$t('animate.textPlaceholder')"
                :disabled="isProcessing"
                required
                @input="handleTextChange"
              ></textarea>
              <div class="char-count" :class="{ 'near-limit': charCount > 150 }">
                {{ charCount }}/180
              </div>
            </div>

            <div class="form-group">
              <label for="emotion">{{ $t('animate.emotion') }}</label>
              <select
                id="emotion"
                :value="emotion"
                :disabled="isProcessing"
                @change="handleEmotionChange"
              >
                <option v-for="e in emotions" :key="e" :value="e">
                  {{ $t(`animate.emotions.${e.toLowerCase()}`) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="action">{{ $t('animate.action') }}</label>
              <select
                id="action"
                :value="action"
                :disabled="isProcessing"
                @change="handleActionChange"
              >
                <option v-for="a in actions" :key="a" :value="a">
                  {{ $t(`animate.actions.${a.charAt(0).toLowerCase() + a.slice(1)}`) }}
                </option>
              </select>
            </div>

            <button type="submit" :disabled="isProcessing" class="submit-button">
              <span v-if="isProcessing" class="loading-spinner"></span>
              <span v-else>{{ $t('animate.submit') }}</span>
            </button>
          </form>
        </div>

        <div class="preview">
          <ModelViewer
            ref="modelViewer"
            :emotion="emotion"
            :action="action"
            class="model-viewer"
          />
          
          <div v-if="audioUrl" class="audio-player">
            <audio
              ref="audioPlayer"
              :src="audioUrl"
              controls
              class="audio-controls"
            ></audio>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelViewer from '@/components/ModelViewer.vue';
import { synthesizeSpeech } from '@/api/azureTTS';

const { t } = useI18n();

const text = ref('你好，我是数字人，这是一个小小的演示，大约持续5秒钟。');
const emotion = ref('Sad');
const action = ref('Idle');
const isProcessing = ref(false);
const audioUrl = ref('');
const audioPlayer = ref<HTMLAudioElement | null>(null);
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);

// 可用的动作和表情
const actions = [
  'Idle', 'Walking', 'Running', 'Jump', 'Wave', 'Dance',
  'Death', 'No', 'Punch', 'Sitting', 'Standing',
  'ThumbsUp', 'WalkJump', 'Yes'
] as const;

const emotions = ['Angry', 'Surprised', 'Sad'] as const;

// 字符计数
const charCount = computed(() => text.value.length);

// 处理文本变化
function handleTextChange(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const newText = target.value;
  if (newText.length > 180) {
    text.value = newText.slice(0, 180);
  } else {
    text.value = newText;
  }
}

// 处理表情变化
function handleEmotionChange(eventOrEmotion: Event | string) {
  const newEmotion = typeof eventOrEmotion === 'string' 
    ? eventOrEmotion 
    : (eventOrEmotion.target as HTMLSelectElement).value;
  emotion.value = newEmotion;
  if (modelViewer.value) {
    modelViewer.value.updateEmotion(newEmotion);
  }
}

// 处理动作变化
function handleActionChange(eventOrAction: Event | string) {
  const newAction = typeof eventOrAction === 'string'
    ? eventOrAction
    : (eventOrAction.target as HTMLSelectElement).value;
  action.value = newAction;
  if (modelViewer.value) {
    modelViewer.value.playAnimation(newAction);
  }
}

// 动画生成
async function onAnimate() {
  if (isProcessing.value || !text.value) return;
  
  if (text.value.length > 180) {
    alert(t('animate.textTooLong'));
    return;
  }
  
  isProcessing.value = true;
  audioUrl.value = '';
  
  try {
    // 1. 合成语音
    const audioBlob = await synthesizeSpeech(text.value);
    audioUrl.value = URL.createObjectURL(audioBlob);
    
    // 2. 播放动画和表情
    if (audioPlayer.value) {
      const audio = audioPlayer.value;
      
      // 移除之前的事件监听器
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleAudioEnded);
      
      // 添加新的事件监听器
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleAudioEnded);
      
      audio.src = audioUrl.value;
      audio.play();
    }
  } catch (error) {
    console.error('Error generating animation:', error);
    isProcessing.value = false;
  }
}

// 处理音频时间更新
function handleTimeUpdate(event: Event) {
  const audio = event.target as HTMLAudioElement;
  const currentTime = audio.currentTime;
  
  // 根据时间更新动作和表情
  if (currentTime < 2) {
    handleActionChange('Idle');
    handleEmotionChange('Sad');
  } else if (currentTime < 4) {
    handleActionChange('Wave');
    handleEmotionChange('Surprised');
  } else {
    handleActionChange('Idle');
    handleEmotionChange('Sad');
  }
}

// 处理音频播放结束
function handleAudioEnded() {
  if (modelViewer.value) {
    modelViewer.value.playAnimation('Idle');
    modelViewer.value.updateEmotion('Sad');
  }
  isProcessing.value = false;
}
</script>

<style lang="scss" scoped>
// 定义颜色变量
$primary-color: #4CAF50;
$danger-color: #f44336;
$text-color: #666;
$border-color: #ddd;
$background-color: #f5f5f5;

// 定义间距变量
$spacing-small: 8px;
$spacing-medium: 16px;
$spacing-large: 24px;

// 定义边框圆角
$border-radius: 4px;

// 定义过渡动画
$transition-duration: 0.3s;
$transition-timing: ease;

// 定义断点
$breakpoint-md: 768px;

.animate-page {
  padding: $spacing-large;
  min-height: 100vh;
  background: $background-color;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: $text-color;
  margin-bottom: $spacing-large;
}

.content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: $spacing-large;
  background: white;
  padding: $spacing-large;
  border-radius: $border-radius * 2;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.controls {
  .control-form {
    display: flex;
    flex-direction: column;
    gap: $spacing-medium;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-small;
  
  label {
    color: $text-color;
    font-size: 0.9rem;
  }
  
  textarea, select {
    padding: $spacing-medium;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    font-size: 1rem;
    transition: border-color $transition-duration $transition-timing;
    
    &:focus {
      outline: none;
      border-color: $primary-color;
    }
    
    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
}

.submit-button {
  margin-top: $spacing-medium;
  padding: $spacing-medium;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: $border-radius;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color $transition-duration $transition-timing;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background: darken($primary-color, 10%);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.preview {
  display: flex;
  flex-direction: column;
  gap: $spacing-medium;
}

.model-viewer {
  flex: 1;
  min-height: 400px;
}

.audio-player {
  padding: $spacing-medium;
  background: #f8f9fa;
  border-radius: $border-radius;
  
  .audio-controls {
    width: 100%;
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: $breakpoint-md) {
  .content {
    grid-template-columns: 1fr;
  }
}

.char-count {
  text-align: right;
  color: $text-color;
  font-size: 0.8rem;
  margin-top: 4px;
  
  &.near-limit {
    color: $danger-color;
  }
}
</style> 
