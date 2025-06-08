<template>
  <div class="test-viewer">
    <h1>{{ t('test.viewer.title') }}</h1>
    
    <div class="viewer-container">
      <ModelViewer
        ref="modelViewer"
        :model-url="modelUrl"
        :auto-rotate="true"
        :show-controls="true"
      />
    </div>

    <div class="controls">
      <div class="control-section">
        <h3>{{ t('test.viewer.animationControl') }}</h3>
        <div class="button-group">
          <button 
            v-for="anim in animations" 
            :key="anim"
            @click="playAnimation(anim)"
            :class="{ active: currentAnimation === anim }"
          >
            {{ t(`animate.actions.${anim.charAt(0).toLowerCase() + anim.slice(1)}`) }}
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>{{ t('test.viewer.emotionControl') }}</h3>
        <div class="button-group">
          <button 
            v-for="emotion in emotions" 
            :key="emotion"
            @click="updateEmotion(emotion)"
            :class="{ active: currentEmotion === emotion }"
          >
            {{ t(`animate.emotions.${emotion.toLowerCase()}`) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ModelViewer from '@/components/ModelViewer.vue'

const { t } = useI18n()
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null)
const modelUrl = '/models/default.glb'
const currentAnimation = ref('')
const currentEmotion = ref('')

const animations = [
  'Idle',
  'Walking',
  'Running',
  'Jump',
  'Wave',
  'Dance',
  'Death',
  'No',
  'Punch',
  'Sitting',
  'Standing',
  'ThumbsUp',
  'WalkJump',
  'Yes'
]

const emotions = [
  'Neutral',
  'Angry',
  'Surprised',
  'Sad'
]

function playAnimation(animation: string) {
  if (modelViewer.value) {
    console.log('Playing animation:', animation);
    modelViewer.value.playAnimation(animation);
    currentAnimation.value = animation;
  }
}

function updateEmotion(emotion: string) {
  if (modelViewer.value) {
    modelViewer.value.updateEmotion(emotion)
    currentEmotion.value = emotion
  }
}
</script>

<style lang="scss" scoped>
.test-viewer {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    margin: 0 0 32px;
    color: #2c3e50;
    font-size: 2em;
  }

  h3 {
    margin: 0 0 16px;
    color: #2c3e50;
    font-size: 1.4em;
  }
}

.viewer-container {
  width: 100%;
  height: 500px;
  margin-bottom: 32px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  .control-section {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;

  button {
    padding: 10px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    color: #2c3e50;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f8f9fa;
      border-color: #42b883;
      color: #42b883;
    }

    &.active {
      background: #42b883;
      color: white;
      border-color: #42b883;
    }
  }
}
</style> 