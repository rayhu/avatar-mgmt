<template>
  <div class="test-viewer">
    <h1>{{ t('test.title') }}</h1>

    <!-- 模型选择器 -->
    <div class="model-selector">
      <h3>{{ t('modelManagement.modelSelection') }}</h3>
      <div v-if="!selectedModel">
        <!-- 错误状态 -->
        <div v-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h4>{{ t('common.error') }}</h4>
          <p>{{ error }}</p>
          <button class="control-btn" @click="fetchReadyModels">
            {{ t('common.retry') }}
          </button>
        </div>
        <!-- 空状态 -->
        <!-- <div v-else-if="readyModels.length === 0" class="empty-state">
          <div class="empty-icon">🤖</div>
          <h4>{{ t('modelManagement.noModelsAvailable') }}</h4>
          <p>{{ t('modelManagement.noModelsDescription') }}</p>
          <button class="control-btn" @click="fetchReadyModels">
            {{ t('common.refresh') }}
          </button>
        </div> -->
        <!-- 模型列表 -->
        <div v-else class="model-list">
          <div
            v-for="model in readyModels"
            :key="model.id"
            class="model-card"
            @click="selectModelWithReset(model)"
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
      </div>
      <div v-else class="selected-model">
        <div class="model-preview">
          <ModelCard :preview-url="selectedModel.previewUrl" />
        </div>
        <div class="model-info">
          <h4>{{ selectedModel.name }}</h4>
          <p>{{ selectedModel.description }}</p>
          <button class="control-btn" @click="changeModel">
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
            :title="getAnimationTooltip(anim)"
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

      <!-- 测试加载界面 -->
      <div class="control-section">
        <h3>测试加载界面</h3>
        <div class="button-group">
          <button @click="testLoading" class="test-btn">🧪 测试加载界面</button>
          <button @click="testError" class="test-btn error">⚠️ 测试错误界面</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelViewer from '../components/ModelViewer.vue';
import ModelCard from '../components/ModelCard.vue';
import { logger } from '../utils/logger';
import { useModelSelection } from '../composables/useModelSelection';
import { useModelAnimations } from '../composables/useModelAnimations';
import type { Avatar } from '../types/avatar';

const { t } = useI18n();
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);

// 使用模型选择组合式函数
const modelSelection = useModelSelection();
const { readyModels, selectedModel, selectModel, changeModel, error, fetchReadyModels } =
  modelSelection;

// 使用动态动画配置
const modelAnimations = useModelAnimations(selectedModel);
const { 
  availableActions, 
  availableEmotions, 
  updateAnimationsForCurrentModel,
  getAnimationByCallName
} = modelAnimations;

// 本地状态管理
const currentAnimation = ref<string>('');
const currentEmotion = ref<string>('');

// 计算属性：可用的动画和表情
const animations = computed(() => availableActions.value.map(anim => anim.callName));
const emotions = computed(() => availableEmotions.value.map(anim => anim.callName));

// 测试加载界面
function testLoading() {
  if (modelViewer.value) {
    // 模拟加载状态
    modelViewer.value.isLoading = true;
    modelViewer.value.loadingProgress = 0;

    // 模拟进度更新
    const interval = setInterval(() => {
      if (modelViewer.value && modelViewer.value.loadingProgress < 100) {
        modelViewer.value.loadingProgress += Math.random() * 20;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (modelViewer.value) {
            modelViewer.value.isLoading = false;
            modelViewer.value.loadingProgress = 0;
          }
        }, 1000);
      }
    }, 200);
  }
}

// 测试错误界面
function testError() {
  if (modelViewer.value) {
    modelViewer.value.loadError = '这是一个测试错误，用于演示错误界面的显示效果。';
  }
}

// 监听模型选择变化，更新动画配置
watch(
  selectedModel,
  newModel => {
    if (newModel) {
      console.log('🔄 TestViewer: 模型选择变化，更新动画配置', newModel.name);
      updateAnimationsForCurrentModel();
    }
  },
  { immediate: true }
);

// 获取动画显示名称
function getAnimationDisplayName(callName: string): string {
  const animation = getAnimationByCallName(callName);
  if (animation) {
    return t(animation.displayName);
  }
  return callName; // 回退到调用名称
}

// 获取动画工具提示（包含 duration 信息）
function getAnimationTooltip(callName: string): string {
  const animation = getAnimationByCallName(callName);
  if (animation && animation.parameters) {
    const duration = animation.parameters.duration;
    const loop = animation.parameters.loop;
    const description = animation.description || '';

    let tooltip = description;
    if (duration) {
      tooltip += `\n⏱️ 时长: ${duration}秒`;
    }
    if (loop !== undefined) {
      tooltip += `\n🔄 ${loop ? '循环播放' : '播放一次后回到待机'}`;
    }
    return tooltip;
  }
  return callName;
}

// 获取表情显示名称
function getEmotionDisplayName(callName: string): string {
  const emotion = getAnimationByCallName(callName);
  if (emotion) {
    return t(emotion.displayName);
  }
  return callName; // 回退到调用名称
}

// 选择模型的包装函数，添加TestViewer特定的逻辑
function selectModelWithReset(model: Avatar): void {
  logger.info('选择模型', {
    component: 'TestViewer',
    method: 'selectModel',
    modelId: model.id,
    modelName: model.name,
  });

  selectModel(model); // 调用useModelSelection提供的selectModel
  currentAnimation.value = '';
  currentEmotion.value = '';
}

function playAnimation(animation: string): void {
  if (modelViewer.value) {
    logger.info('播放动画', {
      component: 'TestViewer',
      method: 'playAnimation',
      animation,
    });

    // 获取动画配置，使用实际名称播放
    const animationConfig = getAnimationByCallName(animation);
    if (animationConfig) {
      console.log('Playing animation:', animationConfig.actualName);
      // 如果有参数配置，传递 duration 和 loop 参数
      if (animationConfig.parameters) {
        const duration = animationConfig.parameters.duration;
        const loop = animationConfig.parameters.loop ?? true;
        modelViewer.value.playAnimation(animationConfig.actualName, duration, loop);
      } else {
        // 其他类型动画使用默认参数
        modelViewer.value.playAnimation(animationConfig.actualName);
      }
      currentAnimation.value = animation;
    } else {
      logger.warn('动画配置未找到', {
        component: 'TestViewer',
        method: 'playAnimation',
        animation,
      });
    }
  }
}

function updateEmotion(emotion: string): void {
  if (modelViewer.value) {
    logger.info('更新表情', {
      component: 'TestViewer',
      method: 'updateEmotion',
      emotion,
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
        emotion,
      });
    }
  }
}

// onMounted logic is now handled by useModelSelection composable
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

.test-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin: 0 5px;
}

.test-btn:hover {
  background: #5a6268;
}

.test-btn.error {
  background: #dc3545;
}

.test-btn.error:hover {
  background: #c82333;
}
</style>
