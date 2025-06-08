<template>
  <div class="animate-page">
    <div class="container">
      <h2>{{ $t('animate.title') }}</h2>
      
      <div class="content">
        <div class="controls">
          <form @submit.prevent="onAnimate" class="control-form">
            <div class="form-group">
              <label for="text">{{ $t('animate.text') }}</label>
              <textarea
                id="text"
                v-model="text"
                :placeholder="$t('animate.textPlaceholder')"
                :disabled="isProcessing"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label for="emotion">{{ $t('animate.emotion') }}</label>
              <select
                id="emotion"
                v-model="emotion"
                :disabled="isProcessing"
              >
                <option value="happy">{{ $t('animate.emotions.happy') }}</option>
                <option value="sad">{{ $t('animate.emotions.sad') }}</option>
                <option value="angry">{{ $t('animate.emotions.angry') }}</option>
                <option value="neutral">{{ $t('animate.emotions.neutral') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="action">{{ $t('animate.action') }}</label>
              <select
                id="action"
                v-model="action"
                :disabled="isProcessing"
              >
                <option value="wave">{{ $t('animate.actions.wave') }}</option>
                <option value="jump">{{ $t('animate.actions.jump') }}</option>
                <option value="nod">{{ $t('animate.actions.nod') }}</option>
                <option value="idle">{{ $t('animate.actions.idle') }}</option>
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
            :emotion="emotion"
            :action="action"
            class="model-viewer"
          />
          
          <div class="audio-player" v-if="audioUrl">
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelViewer from '@/components/ModelViewer.vue';

const { t } = useI18n();

const text = ref('');
const emotion = ref('happy');
const action = ref('wave');
const isProcessing = ref(false);
const audioUrl = ref('');
const audioPlayer = ref<HTMLAudioElement | null>(null);

async function onAnimate() {
  if (isProcessing.value) return;
  
  isProcessing.value = true;
  audioUrl.value = '';
  
  try {
    // 模拟语音合成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 这里应该调用 Azure TTS API
    // 目前使用模拟数据
    audioUrl.value = '/audio/sample.mp3';
    
    // 自动播放音频
    if (audioPlayer.value) {
      audioPlayer.value.play();
    }
  } catch (error) {
    console.error('Error generating animation:', error);
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style lang="scss" scoped>
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
</style> 