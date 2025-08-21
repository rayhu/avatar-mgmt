import { ref, computed, Ref } from 'vue';
import type { Avatar } from '../types/avatar';
import { AnimationType } from '../types/animation';
import modelAnimationsConfig from '../config/model-animations.json';

interface AnimationConfig {
  actualName: string;
  callName: string;
  displayName: string;
  description?: string;
  category?: string;
  enabled: boolean;
  parameters?: {
    loop?: boolean;
    duration?: number;
    speed?: number;
  };
  intensity?: number;
  morphTargets?: string[];
}

interface ModelAnimationConfig {
  id?: number;
  name: string;
  description?: string;
  defaultConfig?: boolean;
  animations: {
    actions: AnimationConfig[];
    emotions: AnimationConfig[];
  };
}

export function useModelAnimations(selectedModel: Ref<Avatar | null>) {
  const currentAnimations = ref<ModelAnimationConfig | null>(null);

  // 根据模型名称获取动画配置
  function getAnimationsForModel(modelName: string): ModelAnimationConfig | null {
    const config = modelAnimationsConfig.models as Record<string, ModelAnimationConfig>;

    // 首先尝试通过模型名称匹配
    if (config[modelName]) {
      console.log(`🎭 找到模型 "${modelName}" 的专用动画配置`);
      return config[modelName];
    }

    // 如果没有找到，使用默认配置
    console.log(`⚠️ 未找到模型 "${modelName}" 的专用配置，使用默认配置`);
    return config.default || null;
  }

  // 当选中模型改变时，更新动画配置
  function updateAnimationsForCurrentModel() {
    if (selectedModel.value) {
      const animationConfig = getAnimationsForModel(selectedModel.value.name);
      currentAnimations.value = animationConfig;
      console.log(`🔄 为模型 "${selectedModel.value.name}" 更新动画配置:`, {
        actionsCount: animationConfig?.animations.actions.length || 0,
        emotionsCount: animationConfig?.animations.emotions.length || 0,
      });
    } else {
      currentAnimations.value = null;
      console.log('🚫 没有选中模型，清除动画配置');
    }
  }

  // 计算属性：当前可用的动作动画
  const availableActions = computed(() => {
    return currentAnimations.value?.animations.actions.filter(action => action.enabled) || [];
  });

  // 计算属性：当前可用的表情动画
  const availableEmotions = computed(() => {
    return currentAnimations.value?.animations.emotions.filter(emotion => emotion.enabled) || [];
  });

  // 根据调用名称获取动画配置
  function getAnimationByCallName(callName: string): AnimationConfig | null {
    if (!currentAnimations.value) return null;

    const allAnimations = [
      ...currentAnimations.value.animations.actions,
      ...currentAnimations.value.animations.emotions,
    ];

    return allAnimations.find(anim => anim.callName === callName) || null;
  }

  // 根据实际名称获取动画配置
  function getAnimationByActualName(actualName: string): AnimationConfig | null {
    if (!currentAnimations.value) return null;

    const allAnimations = [
      ...currentAnimations.value.animations.actions,
      ...currentAnimations.value.animations.emotions,
    ];

    return allAnimations.find(anim => anim.actualName === actualName) || null;
  }

  // 检查动画是否可用
  function isAnimationAvailable(callName: string): boolean {
    const animation = getAnimationByCallName(callName);
    return animation ? animation.enabled : false;
  }

  // 获取动画的显示名称（用于UI）
  function getAnimationDisplayName(callName: string): string {
    const animation = getAnimationByCallName(callName);
    return animation ? animation.displayName : callName;
  }

  // 获取动画的描述
  function getAnimationDescription(callName: string): string {
    const animation = getAnimationByCallName(callName);
    return animation ? animation.description || '' : '';
  }

  // 获取动画的参数
  function getAnimationParameters(callName: string): any {
    const animation = getAnimationByCallName(callName);
    return animation ? animation.parameters : {};
  }

  // 添加新的动画配置到模型
  function addAnimationToModel(
    modelName: string,
    type: 'actions' | 'emotions',
    animation: AnimationConfig
  ): boolean {
    try {
      const config = modelAnimationsConfig.models as Record<string, ModelAnimationConfig>;
      if (!config[modelName]) {
        console.warn(`模型 "${modelName}" 不存在，无法添加动画`);
        return false;
      }

      config[modelName].animations[type].push(animation);

      // 如果当前模型正是这个模型，更新配置
      if (selectedModel.value && selectedModel.value.name === modelName) {
        updateAnimationsForCurrentModel();
      }

      console.log(`✅ 成功为模型 "${modelName}" 添加 ${type} 动画: ${animation.callName}`);
      return true;
    } catch (error) {
      console.error(`❌ 为模型 "${modelName}" 添加动画失败:`, error);
      return false;
    }
  }

  // 从模型中移除动画配置
  function removeAnimationFromModel(
    modelName: string,
    type: 'actions' | 'emotions',
    callName: string
  ): boolean {
    try {
      const config = modelAnimationsConfig.models as Record<string, ModelAnimationConfig>;
      if (!config[modelName]) {
        console.warn(`模型 "${modelName}" 不存在，无法移除动画`);
        return false;
      }

      const animations = config[modelName].animations[type];
      const index = animations.findIndex(anim => anim.callName === callName);

      if (index === -1) {
        console.warn(`动画 "${callName}" 在模型 "${modelName}" 中不存在`);
        return false;
      }

      animations.splice(index, 1);

      // 如果当前模型正是这个模型，更新配置
      if (selectedModel.value && selectedModel.value.name === modelName) {
        updateAnimationsForCurrentModel();
      }

      console.log(`✅ 成功从模型 "${modelName}" 移除 ${type} 动画: ${callName}`);
      return true;
    } catch (error) {
      console.error(`❌ 从模型 "${modelName}" 移除动画失败:`, error);
      return false;
    }
  }

  // 获取所有模型的配置信息
  function getAllModelConfigs(): Record<string, ModelAnimationConfig> {
    return modelAnimationsConfig.models as Record<string, ModelAnimationConfig>;
  }

  return {
    // 状态
    currentAnimations,
    availableActions,
    availableEmotions,

    // 方法
    updateAnimationsForCurrentModel,
    getAnimationsForModel,
    getAnimationByCallName,
    getAnimationByActualName,
    isAnimationAvailable,
    getAnimationDisplayName,
    getAnimationDescription,
    getAnimationParameters,
    addAnimationToModel,
    removeAnimationFromModel,
    getAllModelConfigs,
  };
}
