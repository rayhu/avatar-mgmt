import { ref, Ref, watch } from 'vue';

export interface BackgroundState {
  imageInput: Ref<HTMLInputElement | null>;
  backgroundImage: Ref<string>;
  backgroundImageName: Ref<string>;
  backgroundImageFile: Ref<File | null>;
  backgroundDistance: Ref<number>;
  backgroundOffset: Ref<{ x: number; y: number }>;
  backgroundScale: Ref<number>;
  presetDistances: Array<{ label: string; value: number; icon: string }>;
  handleImageUpload: (event: Event) => void;
  clearBackgroundImage: () => void;
  adjustBackgroundDistance: () => void;
  setBackgroundDistance: (distance: number) => void;
  adjustBackgroundOffset: () => void;
  adjustOffset: (axis: 'x' | 'y', delta: number) => void;
  adjustBackgroundScale: () => void;
  adjustScale: (delta: number) => void;
  resetBackgroundSettings: () => void;
}

export function useBackground(modelViewer: any, isProcessing?: Ref<boolean>): BackgroundState {
  const imageInput = ref<HTMLInputElement | null>(null);
  const backgroundImage = ref<string>('');
  const backgroundImageName = ref<string>('');
  const backgroundImageFile = ref<File | null>(null);

  // 背景控制系统
  const backgroundDistance = ref(-3); // 背景距离，默认 -3
  const backgroundOffset = ref({ x: 0, y: 0 }); // 背景位置偏移
  const backgroundScale = ref(1.0); // 背景缩放

  // 防抖定时器
  let distanceDebounceTimer: number | null = null;
  let offsetDebounceTimer: number | null = null;
  let scaleDebounceTimer: number | null = null;

  // 距离范围限制
  const MIN_DISTANCE = -10;
  const MAX_DISTANCE = -0.5; // 最近不超过-0.5，避免遮住数字人

  // 验证并限制距离值
  function validateDistance(distance: number): number {
    return Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distance));
  }

  // 监听距离变化，确保值在合理范围内
  watch(backgroundDistance, (newDistance) => {
    const validatedDistance = validateDistance(newDistance);
    if (validatedDistance !== newDistance) {
      // 如果值超出范围，自动修正
      backgroundDistance.value = validatedDistance;
      console.warn(`背景距离自动修正: ${newDistance} → ${validatedDistance}`);
    }
  });

  // 预设距离配置
  const presetDistances = [
    { label: '很远', value: -5, icon: '🔍' },
    { label: '中等', value: -3, icon: '📏' },
    { label: '较近', value: -1.5, icon: '📐' },
    { label: '最近', value: -0.5, icon: '🔸' },
  ];

  // 处理图片上传
  function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件');
      return;
    }
    
    // 验证文件大小 (限制为 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件过大，请选择小于10MB的文件');
      return;
    }
    
    // 创建预览 URL
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        backgroundImage.value = e.target?.result as string;
        backgroundImageName.value = file.name;
        backgroundImageFile.value = file;
        
        console.log('🖼️ Background image loaded successfully:', file.name);
        
        // 通知 ModelViewer 更新背景
        if (modelViewer.value) {
          modelViewer.value.setBackgroundImage(backgroundImage.value);
        }
      } catch (error) {
        console.error('❌ Error processing background image:', error);
        // 重置状态
        backgroundImage.value = '';
        backgroundImageName.value = '';
        backgroundImageFile.value = null;
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      // 重置状态
      backgroundImage.value = '';
      backgroundImageName.value = '';
      backgroundImageFile.value = null;
      alert('图片加载失败，请重试');
    };
    
    reader.readAsDataURL(file);
  }

  // 清除背景图片
  function clearBackgroundImage() {
    backgroundImage.value = '';
    backgroundImageName.value = '';
    backgroundImageFile.value = null;
    
    // 通知 ModelViewer 清除背景
    if (modelViewer.value) {
      modelViewer.value.clearBackgroundImage();
    }
  }

  // 背景距离控制（立即执行版本）
  function adjustBackgroundDistanceImmediate() {
    if (modelViewer.value) {
      modelViewer.value.adjustBackgroundDistance(backgroundDistance.value);
    }
  }

  // 背景距离控制（防抖版本）
  function adjustBackgroundDistance() {
    // 如果正在处理语音生成，跳过调整以避免冲突
    if (isProcessing?.value) {
      console.log('⚠️ Skipping background distance adjustment during processing');
      return;
    }
    
    // 清除之前的定时器
    if (distanceDebounceTimer) {
      clearTimeout(distanceDebounceTimer);
    }
    
    // 设置新的防抖定时器
    distanceDebounceTimer = window.setTimeout(() => {
      // 再次检查处理状态
      if (isProcessing?.value) {
        console.log('⚠️ Processing started during debounce, skipping background distance adjustment');
        distanceDebounceTimer = null;
        return;
      }
      console.log('📏 Adjusting background distance to:', backgroundDistance.value);
      adjustBackgroundDistanceImmediate();
      distanceDebounceTimer = null;
    }, 150); // 150ms 防抖
  }

  // 设置预设距离
  function setBackgroundDistance(distance: number) {
    const validatedDistance = validateDistance(distance);
    backgroundDistance.value = validatedDistance;
    // 预设距离使用立即执行，不需要防抖
    adjustBackgroundDistanceImmediate();
    
    // 如果距离被限制，提示用户
    if (validatedDistance !== distance) {
      console.warn(`距离被限制从 ${distance} 调整为 ${validatedDistance}`);
    }
  }

  // 背景位置偏移控制（立即执行版本）
  function adjustBackgroundOffsetImmediate() {
    if (modelViewer.value) {
      modelViewer.value.adjustBackgroundOffset(backgroundOffset.value);
    }
  }

  // 背景位置偏移控制（防抖版本）
  function adjustBackgroundOffset() {
    // 如果正在处理语音生成，跳过调整以避免冲突
    if (isProcessing?.value) {
      console.log('⚠️ Skipping background offset adjustment during processing');
      return;
    }
    
    // 清除之前的定时器
    if (offsetDebounceTimer) {
      clearTimeout(offsetDebounceTimer);
    }
    
    // 设置新的防抖定时器
    offsetDebounceTimer = window.setTimeout(() => {
      // 再次检查处理状态
      if (isProcessing?.value) {
        console.log('⚠️ Processing started during debounce, skipping background offset adjustment');
        offsetDebounceTimer = null;
        return;
      }
      console.log('📍 Adjusting background offset to:', backgroundOffset.value);
      adjustBackgroundOffsetImmediate();
      offsetDebounceTimer = null;
    }, 150); // 150ms 防抖
  }

  // 调整位置偏移
  function adjustOffset(axis: 'x' | 'y', delta: number) {
    backgroundOffset.value[axis] += delta;
    // 按钮调整使用立即执行
    adjustBackgroundOffsetImmediate();
  }

  // 背景缩放控制（立即执行版本）
  function adjustBackgroundScaleImmediate() {
    if (modelViewer.value) {
      modelViewer.value.adjustBackgroundScale(backgroundScale.value);
    }
  }

  // 背景缩放控制（防抖版本）
  function adjustBackgroundScale() {
    // 如果正在处理语音生成，跳过调整以避免冲突
    if (isProcessing?.value) {
      console.log('⚠️ Skipping background scale adjustment during processing');
      return;
    }
    
    // 清除之前的定时器
    if (scaleDebounceTimer) {
      clearTimeout(scaleDebounceTimer);
    }
    
    // 设置新的防抖定时器
    scaleDebounceTimer = window.setTimeout(() => {
      // 再次检查处理状态
      if (isProcessing?.value) {
        console.log('⚠️ Processing started during debounce, skipping background scale adjustment');
        scaleDebounceTimer = null;
        return;
      }
      console.log('🔍 Adjusting background scale to:', backgroundScale.value);
      adjustBackgroundScaleImmediate();
      scaleDebounceTimer = null;
    }, 150); // 150ms 防抖
  }

  // 调整缩放
  function adjustScale(delta: number) {
    backgroundScale.value = Math.max(0.5, Math.min(2.0, backgroundScale.value + delta));
    // 按钮调整使用立即执行
    adjustBackgroundScaleImmediate();
  }

  // 重置背景设置
  function resetBackgroundSettings() {
    // 清除所有防抖定时器
    if (distanceDebounceTimer) {
      clearTimeout(distanceDebounceTimer);
      distanceDebounceTimer = null;
    }
    if (offsetDebounceTimer) {
      clearTimeout(offsetDebounceTimer);
      offsetDebounceTimer = null;
    }
    if (scaleDebounceTimer) {
      clearTimeout(scaleDebounceTimer);
      scaleDebounceTimer = null;
    }
    
    // 使用验证过的默认距离值
    backgroundDistance.value = validateDistance(-3);
    backgroundOffset.value = { x: 0, y: 0 };
    backgroundScale.value = 1.0;
    
    if (modelViewer.value) {
      modelViewer.value.resetBackgroundSettings();
    }
  }

  return {
    imageInput,
    backgroundImage,
    backgroundImageName,
    backgroundImageFile,
    backgroundDistance,
    backgroundOffset,
    backgroundScale,
    presetDistances,
    handleImageUpload,
    clearBackgroundImage,
    adjustBackgroundDistance,
    setBackgroundDistance,
    adjustBackgroundOffset,
    adjustOffset,
    adjustBackgroundScale,
    adjustScale,
    resetBackgroundSettings
  };
}
