<template>
  <div class="animation-selector">
    <!-- 动作动画选择器 -->
    <div class="animation-section">
      <h3>{{ t('animate.timeline.action') }}</h3>
      <div class="animation-grid">
        <button
          v-for="action in actionAnimations"
          :key="action.callName"
          :class="{ 
            'animation-btn': true, 
            'active': currentAction === action.callName,
            'disabled': !action.enabled 
          }"
          :disabled="!action.enabled"
          @click="selectAction(action.callName)"
          :title="t(action.displayName)"
        >
          <span class="animation-name">{{ t(action.displayName) }}</span>
          <span v-if="action.description" class="animation-desc">{{ action.description }}</span>
        </button>
      </div>
    </div>

    <!-- 表情动画选择器 -->
    <div class="animation-section">
      <h3>{{ t('animate.timeline.emotion') }}</h3>
      <div class="animation-grid">
        <button
          v-for="emotion in emotionAnimations"
          :key="emotion.callName"
          :class="{ 
            'animation-btn': true, 
            'active': currentEmotion === emotion.callName,
            'disabled': !emotion.enabled 
          }"
          :disabled="!emotion.enabled"
          @click="selectEmotion(emotion.callName)"
          :title="t(emotion.displayName)"
        >
          <span class="animation-name">{{ t(emotion.displayName) }}</span>
          <span v-if="emotion.description" class="animation-desc">{{ emotion.description }}</span>
        </button>
      </div>
    </div>

    <!-- 动画信息显示 -->
    <div v-if="selectedAnimation" class="animation-info">
      <h4>{{ t('animation.info') }}</h4>
      <div class="info-grid">
        <div class="info-item">
          <label>{{ t('animation.callName') }}:</label>
          <span>{{ selectedAnimation.callName }}</span>
        </div>
        <div class="info-item">
          <label>{{ t('animation.actualName') }}:</label>
          <span>{{ selectedAnimation.actualName }}</span>
        </div>
        <div class="info-item">
          <label>{{ t('animation.displayName') }}:</label>
          <span>{{ t(selectedAnimation.displayName) }}</span>
        </div>
        <div class="info-item">
          <label>{{ t('animation.type') }}:</label>
          <span>{{ selectedAnimation.type }}</span>
        </div>
        <div v-if="selectedAnimation.description" class="info-item">
          <label>{{ t('animation.description') }}:</label>
          <span>{{ selectedAnimation.description }}</span>
        </div>
        <div class="info-item">
          <label>{{ t('animation.enabled') }}:</label>
          <span>
            <template v-if="selectedAnimation.type === 'action' || selectedAnimation.type === 'emotion'">
              {{ 'enabled' in selectedAnimation && selectedAnimation.enabled ? t('common.yes') : t('common.no') }}
            </template>
            <template v-else>
              -
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { animationManager } from '@/utils/animationManager';
import { getActionAnimations, getEmotionAnimations } from '@/config/animations';
import { logger } from '@/utils/logger';
import type { Animation } from '@/types/animation';
import { AnimationType } from '@/types/animation';

const { t } = useI18n();

// 响应式数据
const currentAction = ref<string>('');
const currentEmotion = ref<string>('');
const selectedAnimation = ref<Animation | null>(null);

// 获取动画列表
const actionAnimations = computed(() => getActionAnimations());
const emotionAnimations = computed(() => getEmotionAnimations());

// 选择动作动画
async function selectAction(callName: string) {
  try {
    logger.info('选择动作动画', {
      component: 'AnimationSelector',
      method: 'selectAction',
      callName
    });

    currentAction.value = callName;
    selectedAnimation.value = animationManager.getAnimationByCallName(callName) || null;
    
    // 播放动画
    await animationManager.playAnimation(callName);
    
    // 触发事件
    emit('action-selected', callName);
  } catch (error) {
    logger.error('选择动作动画失败', {
      component: 'AnimationSelector',
      method: 'selectAction',
      callName,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// 选择表情动画
async function selectEmotion(callName: string) {
  try {
    logger.info('选择表情动画', {
      component: 'AnimationSelector',
      method: 'selectEmotion',
      callName
    });

    currentEmotion.value = callName;
    selectedAnimation.value = animationManager.getAnimationByCallName(callName) || null;
    
    // 播放动画
    await animationManager.playAnimation(callName);
    
    // 触发事件
    emit('emotion-selected', callName);
  } catch (error) {
    logger.error('选择表情动画失败', {
      component: 'AnimationSelector',
      method: 'selectEmotion',
      callName,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// 事件定义
const emit = defineEmits<{
  'action-selected': [callName: string];
  'emotion-selected': [callName: string];
}>();

// 组件挂载时设置动画管理器
onMounted(() => {
  logger.info('动画选择器组件挂载', {
    component: 'AnimationSelector',
    method: 'onMounted'
  });
});

// 暴露方法给父组件
defineExpose({
  selectAction,
  selectEmotion,
  getCurrentAction: () => currentAction.value,
  getCurrentEmotion: () => currentEmotion.value,
  getSelectedAnimation: () => selectedAnimation.value
});
</script>

<style lang="scss" scoped>
.animation-selector {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;

  .animation-section {
    margin-bottom: 24px;

    h3 {
      margin: 0 0 16px;
      color: #2c3e50;
      font-size: 1.2em;
      font-weight: 600;
    }
  }

  .animation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .animation-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;

    &:hover:not(.disabled) {
      border-color: #007bff;
      background: #f8f9ff;
    }

    &.active {
      border-color: #28a745;
      background: #f8fff9;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f8f9fa;
    }

    .animation-name {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .animation-desc {
      font-size: 0.85em;
      color: #6c757d;
      line-height: 1.3;
    }
  }

  .animation-info {
    margin-top: 24px;
    padding: 16px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e9ecef;

    h4 {
      margin: 0 0 16px;
      color: #2c3e50;
      font-size: 1.1em;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .info-item {
      display: flex;
      align-items: center;

      label {
        font-weight: 600;
        color: #495057;
        margin-right: 8px;
        min-width: 80px;
      }

      span {
        color: #6c757d;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }
    }
  }
}
</style> 
