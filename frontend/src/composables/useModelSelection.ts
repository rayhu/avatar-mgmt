import { ref, Ref, onMounted } from 'vue';
import type { Avatar } from '../types/avatar';
import { getAvatars } from '../api/avatars';

export interface ModelSelectionState {
  readyModels: Ref<Avatar[]>;
  selectedModel: Ref<Avatar | null>;
  currentEmotion: Ref<string>;
  currentAction: Ref<string>;
  fetchReadyModels: () => Promise<void>;
  selectModel: (model: Avatar) => void;
  changeModel: () => void;
}

export function useModelSelection(): ModelSelectionState {
  const readyModels = ref<Avatar[]>([]);
  const selectedModel = ref<Avatar | null>(null);
  const currentEmotion = ref('');
  const currentAction = ref('Idle');

  // 获取就绪状态的模型列表
  async function fetchReadyModels() {
    try {
      const models = await getAvatars();
      if (Array.isArray(models)) {
        readyModels.value = models.filter((model) => model.status === 'ready');
      } else {
        console.error('Invalid models data:', models);
        readyModels.value = [];
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      readyModels.value = [];
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

  // 组件挂载时获取模型列表
  onMounted(async () => {
    try {
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await fetchReadyModels();
    } catch (error) {
      console.error('Failed to fetch models on mount:', error);
    }
  });

  return {
    readyModels,
    selectedModel,
    currentEmotion,
    currentAction,
    fetchReadyModels,
    selectModel,
    changeModel
  };
}
