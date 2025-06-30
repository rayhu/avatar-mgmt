<template>
  <div class="test-viewer">
    <h1>{{ t('test.title') }}</h1>

    <!-- 模型选择器 -->
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
            <ModelCard :preview-url="model.previewUrl" />
          </div>
          <div class="model-info">
            <h4>{{ model.name }}</h4>
            <p>{{ model.description }}</p>
          </div>
        </div>
      </div>
      <div v-else class="selected-model">
        <div class="model-preview">
          <ModelCard :preview-url="selectedModel.previewUrl" />
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

    <!-- 模型查看器 -->
    <div class="viewer-container">
      <ModelViewer
        ref="modelViewer"
        :model-url="selectedModel?.url"
        :auto-rotate="true"
        :show-controls="true"
      />
    </div>

    <!-- 控制面板 -->
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
            {{ getAnimationDisplayName(anim) }}
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
            {{ getEmotionDisplayName(emotion) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelViewer from '../components/ModelViewer.vue';
import { getAvatars } from '../api/avatars';
import type { Avatar } from '../types/avatar';
import ModelCard from '../components/ModelCard.vue';
import { getActionAnimations, getEmotionAnimations, getAnimationByCallName } from '@/config/animations';
import { logger } from '@/utils/logger';

const { t } = useI18n();
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);
const readyModels = ref<Avatar[]>([]);
const selectedModel = ref<Avatar | null>(null);
const currentAnimation = ref<string>('');
const currentEmotion = ref<string>('');

// 使用配置文件中的动画，而不是硬编码
const animations = getActionAnimations().map(anim => anim.callName);
const emotions = getEmotionAnimations().map(anim => anim.callName);

// 获取动画显示名称
function getAnimationDisplayName(callName: string): string {
  const animation = getAnimationByCallName(callName);
  if (animation) {
    return t(animation.displayName);
  }
  return callName; // 回退到调用名称
}

// 获取表情显示名称
function getEmotionDisplayName(callName: string): string {
  const emotion = getAnimationByCallName(callName);
  if (emotion) {
    return t(emotion.displayName);
  }
  return callName; // 回退到调用名称
}

// 获取就绪状态的模型列表
async function fetchReadyAvatars(): Promise<void> {
  try {
    logger.info('获取就绪状态的模型列表', {
      component: 'TestViewer',
      method: 'fetchReadyAvatars'
    });
    
    const avatars = await getAvatars();
    console.log('Fetched avatars:', avatars);
    readyModels.value = avatars.filter((model) => model.status === 'ready');
    console.log('Ready models:', readyModels.value);
    
    logger.info('模型列表获取成功', {
      component: 'TestViewer',
      method: 'fetchReadyAvatars',
      count: readyModels.value.length
    });
  } catch (error) {
    logger.error('获取模型列表失败', {
      component: 'TestViewer',
      method: 'fetchReadyAvatars',
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Failed to fetch models:', error);
  }
}

// 选择模型
function selectModel(model: Avatar): void {
  logger.info('选择模型', {
    component: 'TestViewer',
    method: 'selectModel',
    modelId: model.id,
    modelName: model.name
  });
  
  selectedModel.value = model;
  currentAnimation.value = '';
  currentEmotion.value = '';
}

function playAnimation(animation: string): void {
  if (modelViewer.value) {
    logger.info('播放动画', {
      component: 'TestViewer',
      method: 'playAnimation',
      animation
    });
    
    // 获取动画配置，使用实际名称播放
    const animationConfig = getAnimationByCallName(animation);
    if (animationConfig) {
      console.log('Playing animation:', animationConfig.actualName);
      modelViewer.value.playAnimation(animationConfig.actualName);
      currentAnimation.value = animation;
    } else {
      logger.warn('动画配置未找到', {
        component: 'TestViewer',
        method: 'playAnimation',
        animation
      });
    }
  }
}

function updateEmotion(emotion: string): void {
  if (modelViewer.value) {
    logger.info('更新表情', {
      component: 'TestViewer',
      method: 'updateEmotion',
      emotion
    });
    
    // 获取表情配置，使用实际名称更新
    const emotionConfig = getAnimationByCallName(emotion);
    if (emotionConfig) {
      modelViewer.value.updateEmotion(emotionConfig.actualName);
      currentEmotion.value = emotion;
    } else {
      logger.warn('表情配置未找到', {
        component: 'TestViewer',
        method: 'updateEmotion',
        emotion
      });
    }
  }
}

onMounted(() => {
  logger.info('TestViewer 组件挂载', {
    component: 'TestViewer',
    method: 'onMounted'
  });
  
  fetchReadyAvatars();
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
