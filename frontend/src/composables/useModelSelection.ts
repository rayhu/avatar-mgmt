import { ref, Ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Avatar } from '../types/avatar';
import { getAvatars } from '../api/avatars';

export interface ModelSelectionState {
  readyModels: Ref<Avatar[]>;
  selectedModel: Ref<Avatar | null>;
  currentEmotion: Ref<string>;
  currentAction: Ref<string>;
  error: Ref<string>;
  fetchReadyModels: () => Promise<void>;
  selectModel: (model: Avatar) => void;
  changeModel: () => void;
}

export function useModelSelection(): ModelSelectionState {
  const route = useRoute();
  const readyModels = ref<Avatar[]>([]);
  const selectedModel = ref<Avatar | null>(null);
  const currentEmotion = ref('');
  const currentAction = ref('Idle');
  const error = ref('');

  // 获取就绪状态的模型列表
  async function fetchReadyModels() {
    try {
      error.value = '';
      const models = await getAvatars();
      if (Array.isArray(models)) {
        readyModels.value = models.filter(model => model.status === 'ready');
      } else {
        console.error('Invalid models data:', models);
        readyModels.value = [];
        error.value = 'Invalid data format received from server';
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      readyModels.value = [];
      error.value = err instanceof Error ? err.message : 'Failed to load models';
    }
  }

  // 选择模型
  function selectModel(model: Avatar) {
    selectedModel.value = model;
    currentEmotion.value = '';
    currentAction.value = 'Idle';
  }

  // 更换模型
  function changeModel() {
    selectedModel.value = null;
    currentEmotion.value = '';
    currentAction.value = 'Idle';
  }

  // 根据路由参数自动选择模型
  function autoSelectModelFromRoute() {
    const modelId = route.query.modelId as string;
    if (modelId && readyModels.value.length > 0) {
      // 支持字符串和数字ID的匹配，统一转换为字符串进行比较
      const targetModel = readyModels.value.find(model => {
        const modelIdStr = model.id.toString();
        return modelIdStr === modelId;
      });
      if (targetModel) {
        console.log('🎯 从路由参数自动选择模型:', targetModel.name, '(ID:', targetModel.id, ')');
        selectModel(targetModel);
      } else {
        console.warn('⚠️ 路由参数中的模型ID未找到:', modelId, '可用ID:', readyModels.value.map(m => m.id));
      }
    }
  }

  // 监听readyModels变化，当模型加载完成后自动选择
  watch(readyModels, () => {
    autoSelectModelFromRoute();
  }, { immediate: false });

  // 监听路由参数变化
  watch(() => route.query.modelId, (newModelId) => {
    if (newModelId && readyModels.value.length > 0) {
      autoSelectModelFromRoute();
    }
  });

  // 组件挂载时获取模型列表
  onMounted(async () => {
    try {
      // 模拟API调用延迟
      await fetchReadyModels();
      // fetchReadyModels完成后，watch会自动触发autoSelectModelFromRoute
    } catch (error) {
      console.error('Failed to fetch models on mount:', error);
    }
  });

  return {
    readyModels,
    selectedModel,
    currentEmotion,
    currentAction,
    error,
    fetchReadyModels,
    selectModel,
    changeModel,
  };
}
