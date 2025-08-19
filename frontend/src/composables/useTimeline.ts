import { ref, Ref, computed } from 'vue';

export interface Keyframe {
  id: string;
  time: number;
  type: 'action' | 'emotion';
  action?: string;
  emotion?: string;
}

export interface TimelineState {
  actionKeyframes: Ref<Keyframe[]>;
  emotionKeyframes: Ref<Keyframe[]>;
  selectedKeyframe: Ref<Keyframe | null>;
  isDragging: Ref<boolean>;
  dragStartX: Ref<number>;
  dragStartTime: Ref<number>;
  timeMarkers: Ref<{ all: number[]; mobile: number[] }>;
  addActionKeyframe: (time?: number) => void;
  addEmotionKeyframe: (time?: number) => void;
  selectKeyframe: (keyframe: Keyframe) => void;
  deleteKeyframe: (keyframe: Keyframe) => void;
  updateKeyframe: (keyframe: Keyframe) => void;
  clearTimeline: () => void;
  startDrag: (keyframe: Keyframe, event: MouseEvent) => void;
  onDrag: (event: MouseEvent) => void;
  stopDrag: () => void;
  onTrackClick: (type: 'action' | 'emotion', event: MouseEvent) => void;
  getActionDisplayName: (action: string) => string;
  getEmotionDisplayName: (emotion: string) => string;
}

export function useTimeline(
  actionAnimations: any[],
  emotionAnimations: any[],
  modelViewer: any,
  currentAction: Ref<string>,
  currentEmotion: Ref<string>
): TimelineState {
  const actionKeyframes = ref<Keyframe[]>([]);
  const emotionKeyframes = ref<Keyframe[]>([]);
  const selectedKeyframe = ref<Keyframe | null>(null);
  const isDragging = ref(false);
  const dragStartX = ref(0);
  const dragStartTime = ref(0);

  // 时间标记配置
  const timeMarkers = computed(() => ({
    all: Array.from({ length: 31 }, (_, i) => i + 1), // 桌面端：0-30秒，每1秒
    mobile: Array.from({ length: 7 }, (_, i) => i * 5 + 1), // 移动端：0,5,10,15,20,25,30秒
  }));

  // 提取动作名称数组（用于下拉框）
  const actions = computed(() =>
    actionAnimations.filter(anim => anim.enabled).map(anim => anim.actualName)
  );

  // 提取表情名称数组（用于下拉框）
  const emotions = computed(() =>
    emotionAnimations.filter(anim => anim.enabled).map(anim => anim.actualName)
  );

  // 添加动作关键帧
  function addActionKeyframe(time: number = 0) {
    const keyframe: Keyframe = {
      id: Date.now().toString(),
      time,
      type: 'action',
      action: 'Idle',
    };
    actionKeyframes.value.push(keyframe);
    selectedKeyframe.value = keyframe;
  }

  // 添加表情关键帧
  function addEmotionKeyframe(time: number = 0) {
    const keyframe: Keyframe = {
      id: Date.now().toString(),
      time,
      type: 'emotion',
      emotion: 'Sad',
    };
    emotionKeyframes.value.push(keyframe);
    selectedKeyframe.value = keyframe;
  }

  // 选择关键帧
  function selectKeyframe(keyframe: Keyframe) {
    selectedKeyframe.value = keyframe;
    // 同步当前动作/表情
    if (keyframe.type === 'action' && keyframe.action) {
      currentAction.value = keyframe.action;
      if (modelViewer.value) modelViewer.value.playAnimation(keyframe.action);
    } else if (keyframe.type === 'emotion' && keyframe.emotion) {
      currentEmotion.value = keyframe.emotion;
      if (modelViewer.value) modelViewer.value.updateEmotion(keyframe.emotion);
    }
  }

  // 删除关键帧
  function deleteKeyframe(keyframe: Keyframe) {
    if (keyframe.type === 'action') {
      actionKeyframes.value = actionKeyframes.value.filter((k: Keyframe) => k.id !== keyframe.id);
    } else {
      emotionKeyframes.value = emotionKeyframes.value.filter((k: Keyframe) => k.id !== keyframe.id);
    }
    if (selectedKeyframe.value?.id === keyframe.id) {
      selectedKeyframe.value = null;
    }
  }

  // 更新关键帧
  function updateKeyframe(keyframe: Keyframe) {
    if (keyframe.type === 'action') {
      const index = actionKeyframes.value.findIndex(k => k.id === keyframe.id);
      if (index !== -1) {
        actionKeyframes.value[index] = { ...keyframe };
        // 如果当前选中，立即切换动作
        if (selectedKeyframe.value?.id === keyframe.id && keyframe.action) {
          currentAction.value = keyframe.action;
          if (modelViewer.value) modelViewer.value.playAnimation(keyframe.action);
        }
      }
    } else if (keyframe.type === 'emotion') {
      const index = emotionKeyframes.value.findIndex(k => k.id === keyframe.id);
      if (index !== -1) {
        emotionKeyframes.value[index] = { ...keyframe };
        // 如果当前选中，立即切换表情
        if (selectedKeyframe.value?.id === keyframe.id && keyframe.emotion) {
          currentEmotion.value = keyframe.emotion;
          if (modelViewer.value) modelViewer.value.updateEmotion(keyframe.emotion);
        }
      }
    }
  }

  // 清空时间轴
  function clearTimeline() {
    if (confirm('确定要清空时间轴吗？')) {
      actionKeyframes.value = [];
      emotionKeyframes.value = [];
      selectedKeyframe.value = null;
    }
  }

  // 开始拖拽
  function startDrag(keyframe: Keyframe, event: MouseEvent) {
    if (!keyframe) return;

    isDragging.value = true;
    dragStartX.value = event.clientX;
    dragStartTime.value = keyframe.time;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  }

  // 拖拽中
  function onDrag(event: MouseEvent) {
    if (!isDragging.value || !selectedKeyframe.value) return;

    const deltaX = event.clientX - dragStartX.value;
    const track = document.querySelector('.track-content') as HTMLElement;
    const rect = track?.getBoundingClientRect();
    if (!rect) return;

    const deltaTime = (deltaX / (rect.width - 4)) * 30;
    const newTime = Math.max(0, Math.min(30, dragStartTime.value + deltaTime));

    // 确保 newTime 是有效的数字
    if (typeof newTime === 'number' && !isNaN(newTime)) {
      selectedKeyframe.value.time = Number(newTime.toFixed(1));
    }
  }

  // 停止拖拽
  function stopDrag() {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  // 处理轨道点击
  function onTrackClick(type: 'action' | 'emotion', event: MouseEvent) {
    if (!event.target) return;

    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const time = (clickX / rect.width) * 30; // 30秒时间轴

    if (type === 'action') {
      addActionKeyframe(time);
    } else {
      addEmotionKeyframe(time);
    }
  }

  // 获取动作显示名称
  function getActionDisplayName(action: string) {
    const actionData = actionAnimations.find(anim => anim.actualName === action);
    return actionData ? actionData.displayName : action;
  }

  // 获取表情显示名称
  function getEmotionDisplayName(emotion: string) {
    const emotionData = emotionAnimations.find(anim => anim.actualName === emotion);
    return emotionData ? emotionData.displayName : emotion;
  }

  return {
    actionKeyframes,
    emotionKeyframes,
    selectedKeyframe,
    isDragging,
    dragStartX,
    dragStartTime,
    timeMarkers,
    addActionKeyframe,
    addEmotionKeyframe,
    selectKeyframe,
    deleteKeyframe,
    updateKeyframe,
    clearTimeline,
    startDrag,
    onDrag,
    stopDrag,
    onTrackClick,
    getActionDisplayName,
    getEmotionDisplayName,
  };
}
