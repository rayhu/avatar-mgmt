<template>
  <div class="test-viewer">
    <h1>模型查看器测试页面</h1>
    
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
        <h3>动画控制</h3>
        <div class="button-group">
          <button 
            v-for="anim in animations" 
            :key="anim"
            @click="playAnimation(anim)"
            :class="{ active: currentAnimation === anim }"
          >
            {{ anim }}
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>表情控制</h3>
        <div class="button-group">
          <button 
            v-for="emotion in emotions" 
            :key="emotion"
            @click="updateEmotion(emotion)"
            :class="{ active: currentEmotion === emotion }"
          >
            {{ emotion }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ModelViewer from '@/components/ModelViewer.vue'

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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
}

.viewer-container {
  width: 100%;
  height: 500px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;

  .control-section {
    h3 {
      margin-bottom: 10px;
      color: #333;
    }
  }
}

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;

  button {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #e6f7ff;
      border-color: #1890ff;
    }

    &.active {
      background: #1890ff;
      color: white;
      border-color: #1890ff;
    }
  }
}
</style> 