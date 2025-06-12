<template>
  <div class="test-viewer">
    <h1>{{ t('test.title') }}</h1>

    <!-- 模型选择 -->
    <div class="model-selector">
      <h3>{{ t('modelManagement.modelSelection') }}</h3>
      <div v-if="!selectedModel" class="model-list">
        <div
          v-for="model in readyModels"
          :key="model.id"
          class="model-card"
          @click="selectModel(model)"
        >
          <div class="model-preview">
            <ModelViewer :model-url="model.url" :auto-rotate="true" :show-controls="false" />
          </div>
          <div class="model-info">
            <h4>{{ model.name }}</h4>
            <p>{{ model.description }}</p>
          </div>
        </div>
      </div>
      <div v-else class="selected-model">
        <div class="model-preview">
          <ModelViewer :model-url="selectedModel.url" :auto-rotate="true" :show-controls="false" />
        </div>
        <div class="model-info">
          <h4>{{ selectedModel.name }}</h4>
          <p>{{ selectedModel.description }}</p>
          <button class="control-btn" @click="selectedModel = null">
            {{ t('modelManagement.changeModel') }}
          </button>
        </div>
      </div>
    </div>

    <div class="viewer-container">
      <ModelViewer
        ref="modelViewer"
        :model-url="selectedModel?.url || '/models/default.glb'"
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
            :class="{ active: currentAnimation === anim }"
            @click="playAnimation(anim)"
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
            :class="{ active: currentEmotion === emotion }"
            @click="updateEmotion(emotion)"
          >
            {{ t(`animate.emotions.${emotion.toLowerCase()}`) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelViewer from '../components/ModelViewer.vue';
import { getModels } from '../api/model';
import type { Model } from '../types/model';

const { t } = useI18n();
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);
const readyModels = ref<Model[]>([]);
const selectedModel = ref<Model | null>(null);
const currentAnimation = ref<string>('');
const currentEmotion = ref<string>('');

const animations: string[] = [
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
  'Yes',
];

const emotions: string[] = ['Neutral', 'Angry', 'Surprised', 'Sad'];

// 获取就绪状态的模型列表
async function fetchReadyModels(): Promise<void> {
  try {
    const models = await getModels();
    readyModels.value = models.filter((model) => model.status === 'ready');
  } catch (error) {
    console.error('Failed to fetch models:', error);
  }
}

// 选择模型
function selectModel(model: Model): void {
  selectedModel.value = model;
  currentAnimation.value = '';
  currentEmotion.value = '';
}

function playAnimation(animation: string): void {
  if (modelViewer.value) {
    console.log('Playing animation:', animation);
    modelViewer.value.playAnimation(animation);
    currentAnimation.value = animation;
  }
}

function updateEmotion(emotion: string): void {
  if (modelViewer.value) {
    modelViewer.value.updateEmotion(emotion);
    currentEmotion.value = emotion;
  }
}

onMounted(() => {
  fetchReadyModels();
});
</script>

@use "@/assets/styles/variables.scss" as *;

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

.model-selector {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  h3 {
    margin: 0 0 16px;
    color: #2c3e50;
    font-size: 1.4em;
  }
}

.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.model-card {
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .model-preview {
    width: 100%;
    height: 200px;
    background: #fff;
  }

  .model-info {
    padding: 16px;

    h4 {
      margin: 0 0 8px;
      color: #2c3e50;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 0.9em;
    }
  }
}

.selected-model {
  display: flex;
  gap: 24px;
  align-items: center;

  .model-preview {
    width: 200px;
    height: 200px;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
  }

  .model-info {
    flex: 1;

    h4 {
      margin: 0 0 8px;
      color: #2c3e50;
    }

    p {
      margin: 0 0 16px;
      color: #666;
    }
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
