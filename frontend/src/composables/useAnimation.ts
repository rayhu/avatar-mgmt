import { ref, Ref, nextTick } from 'vue';

export interface AnimationState {
  isProcessing: Ref<boolean>;
  audioUrl: Ref<string>;
  animationTimer: Ref<number | null>;
  visemeTimeline: Array<{ id: number; t: number }>;
  onAnimate: () => Promise<void>;
  startTimelineAnimation: (audio: HTMLAudioElement) => void;
  handleViseme: (id: number, t: number, anim?: string) => void;
  syncVisemeWithAudio: (audio: HTMLAudioElement) => void;
  speak: () => Promise<void>;
}

export function useAnimation(
  text: Ref<string>,
  ssml: Ref<string>,
  selectedVoice: Ref<string>,
  modelViewer: any,
  currentAction: Ref<string>,
  currentEmotion: Ref<string>,
  synthesizeSpeech: (content: string, voice: string, isSSML: boolean, handleViseme?: (id: number, t: number, anim?: string) => void) => Promise<Blob>,
  t: (key: string) => string,
  actionKeyframes?: Ref<any[]>,
  emotionKeyframes?: Ref<any[]>,
  audioPlayer?: Ref<HTMLAudioElement | null>
): AnimationState {
  const isProcessing = ref(false);
  const audioUrl = ref<string>('');
  const animationTimer = ref<number | null>(null);
  const visemeTimeline: Array<{ id: number; t: number }> = [];

  // 主要动画生成函数
  async function onAnimate() {
    if (!text.value.trim()) {
      alert(t('animate.textRequired'));
      return;
    }

    if (text.value.length > 180) {
      alert(t('animate.textTooLong'));
      return;
    }

    console.log('🎬 Starting animation generation...');
    console.log('Text:', text.value);
    console.log('SSML:', ssml.value);
    console.log('Selected voice:', selectedVoice.value);
    console.log('Model viewer:', modelViewer.value);

    try {
      isProcessing.value = true;
      console.log('🎯 isProcessing set to true');
      
      // 清理之前的状态
      if (animationTimer.value) {
        console.log('🧹 Cleaning up previous animation timer');
        clearInterval(animationTimer.value);
        animationTimer.value = null;
      }
      
      // 停止当前音频播放
      const currentAudio = audioPlayer?.value || document.querySelector('audio') as HTMLAudioElement;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      // 重置模型状态
      if (modelViewer.value) {
        console.log('🔄 Resetting model state');
        modelViewer.value.playAnimation('Idle');
        modelViewer.value.updateEmotion('');
      }
      
      console.log('🔊 Synthesizing speech...');
      const audioBlob = await synthesizeSpeech(
        ssml.value || text.value,
        selectedVoice.value,
        Boolean(ssml.value),
        handleViseme,
      );
      console.log('✅ Speech synthesized successfully');
      
      // 清理之前的音频 URL
      if (audioUrl.value) {
        try {
          URL.revokeObjectURL(audioUrl.value);
        } catch (error) {
          console.warn('⚠️ Failed to revoke previous audio URL:', error);
        }
      }
      
      try {
        audioUrl.value = URL.createObjectURL(audioBlob);
        console.log('✅ Audio URL created successfully:', audioUrl.value);
      } catch (error) {
        console.error('❌ Failed to create audio URL:', error);
        throw error;
      }

      // 播放音频并驱动动画
      nextTick(() => {
        const audio = audioPlayer?.value || document.querySelector('audio') as HTMLAudioElement;
        if (audio) {
          console.log('🎵 Starting audio playback and animation...');
          console.log('🔍 Audio element state:', {
            src: audio.src,
            readyState: audio.readyState,
            networkState: audio.networkState,
            currentTime: audio.currentTime,
            duration: audio.duration || 'unknown'
          });
          
          // 确保音频源已设置
          if (!audio.src && audioUrl.value) {
            console.log('🔄 Setting audio src:', audioUrl.value);
            audio.src = audioUrl.value;
          }
          
          // 等待音频准备就绪
          const playAudio = () => {
            audio.currentTime = 0;
            audio.play().then(() => {
              console.log('✅ Audio started playing');
              startTimelineAnimation(audio);

              // 开始口型同步
              visemeTimeline.length = 0; // 清空旧数据
              syncVisemeWithAudio(audio);
            }).catch((error) => {
              console.error('❌ Failed to play audio:', error);
              console.log('🔍 Audio element debug info:', {
                src: audio.src,
                readyState: audio.readyState,
                networkState: audio.networkState,
                error: audio.error
              });
            });
          };
          
          // 如果音频还没有准备好，等待它加载
          if (audio.readyState >= 2) {
            playAudio();
          } else {
            console.log('⏳ Waiting for audio to be ready...');
            audio.addEventListener('canplay', playAudio, { once: true });
            audio.addEventListener('error', (e) => {
              console.error('❌ Audio loading error:', e);
            }, { once: true });
            
            // 触发加载
            audio.load();
          }
        } else {
          console.error('❌ Audio element not found');
        }
      });
    } catch (error) {
      console.error('❌ Failed to synthesize speech:', error);
      alert(t('animate.synthesisError'));
    } finally {
      isProcessing.value = false;
      console.log('🎯 isProcessing set to false');
    }
  }

  // 启动时间轴动画
  function startTimelineAnimation(audio: HTMLAudioElement) {
    console.log('🎭 Starting timeline animation...');
    
    let lastAction = currentAction.value;
    let lastEmotion = currentEmotion.value;

    // 清理旧定时器
    if (animationTimer.value) {
      console.log('🧹 Cleaning up existing animation timer');
      clearInterval(animationTimer.value);
      animationTimer.value = null;
    }

    // 获取关键帧数据
    const actionFrames = actionKeyframes?.value || [];
    const emotionFrames = emotionKeyframes?.value || [];
    
    console.log(`📊 Timeline animation data:`, {
      actionKeyframes: actionFrames.length,
      emotionKeyframes: emotionFrames.length,
      actionFramesData: actionFrames,
      emotionFramesData: emotionFrames
    });

    // 如果没有关键帧，使用默认状态
    if (actionFrames.length === 0) {
      console.log('No action keyframes found, using default Idle animation');
    }
    
    if (emotionFrames.length === 0) {
      console.log('No emotion keyframes found, using default emotion');
    }

    // 应用初始状态
    let initialAction = 'Idle';
    let initialEmotion = '';
    
    // 查找 t=0 时的关键帧或最早的关键帧
    const initialActionFrame = actionFrames
      .sort((a, b) => a.time - b.time)
      .find(frame => frame.time <= 0.1) || actionFrames[0];
    
    const initialEmotionFrame = emotionFrames
      .sort((a, b) => a.time - b.time)
      .find(frame => frame.time <= 0.1) || emotionFrames[0];
    
    if (initialActionFrame?.action) {
      initialAction = initialActionFrame.action;
    }
    
    if (initialEmotionFrame?.emotion) {
      initialEmotion = initialEmotionFrame.emotion;
    }
    
    console.log(`🎬 Setting initial states - Action: ${initialAction}, Emotion: ${initialEmotion}`);
    currentAction.value = initialAction;
    currentEmotion.value = initialEmotion;
    if (modelViewer.value) {
      modelViewer.value.playAnimation(initialAction);
      if (initialEmotion) {
        modelViewer.value.updateEmotion(initialEmotion);
      }
    }
    lastAction = initialAction;
    lastEmotion = initialEmotion;

    // 创建按时间排序的关键帧数组用于检查
    const sortedActionFrames = [...actionFrames].sort((a, b) => a.time - b.time);
    const sortedEmotionFrames = [...emotionFrames].sort((a, b) => a.time - b.time);
    
    let actionIndex = 0;
    let emotionIndex = 0;

    animationTimer.value = window.setInterval(() => {
      const currentTime = audio.currentTime;
      
      // 检查动作关键帧
      while (actionIndex < sortedActionFrames.length) {
        const frame = sortedActionFrames[actionIndex];
        if (currentTime >= frame.time && frame.action && frame.action !== lastAction) {
          const timeStr = typeof currentTime === 'number' && !isNaN(currentTime) ? currentTime.toFixed(2) : '0.00';
          console.log(`🎬 Triggering action keyframe at ${timeStr}s: ${frame.action}`);
          currentAction.value = frame.action;
          if (modelViewer.value) {
            modelViewer.value.playAnimation(frame.action);
          }
          lastAction = frame.action;
          actionIndex++;
        } else if (currentTime >= frame.time) {
          actionIndex++;
        } else {
          break;
        }
      }
      
      // 检查表情关键帧
      while (emotionIndex < sortedEmotionFrames.length) {
        const frame = sortedEmotionFrames[emotionIndex];
        if (currentTime >= frame.time && frame.emotion && frame.emotion !== lastEmotion) {
          const timeStr = typeof currentTime === 'number' && !isNaN(currentTime) ? currentTime.toFixed(2) : '0.00';
          console.log(`😊 Triggering emotion keyframe at ${timeStr}s: ${frame.emotion}`);
          currentEmotion.value = frame.emotion;
          if (modelViewer.value) {
            modelViewer.value.updateEmotion(frame.emotion);
          }
          lastEmotion = frame.emotion;
          emotionIndex++;
        } else if (currentTime >= frame.time) {
          emotionIndex++;
        } else {
          break;
        }
      }
      
      // 音频播放结束，清理定时器并重置为 Idle
      if (audio.ended) {
        console.log('Audio ended, cleaning up animation timer');
        clearInterval(animationTimer.value!);
        animationTimer.value = null;
        // 重置动作和表情
        currentAction.value = 'Idle';
        currentEmotion.value = '';
        if (modelViewer.value) {
          modelViewer.value.playAnimation('Idle');
          modelViewer.value.updateEmotion('');
        }
      }
    }, 100); // 每 100ms 检查一次
    
    console.log('✅ Timeline animation started with keyframe data');
  }

  // 处理口型事件
  function handleViseme(id: number, t: number, _anim?: string) {
    // 将口型事件发送给 ModelViewer
    if (modelViewer.value && typeof (modelViewer.value as any).updateViseme === 'function') {
      (modelViewer.value as any).updateViseme(id);
    }

    // 记录到时间轴
    visemeTimeline.push({ id, t });
  }

  // 播放器启动时根据 currentTime 同步 viseme
  function syncVisemeWithAudio(audio: HTMLAudioElement) {
    let idx = 0;
    function tick() {
      const now = audio.currentTime * 1000; // ms
      while (idx < visemeTimeline.length && now >= visemeTimeline[idx].t) {
        const { id, t } = visemeTimeline[idx++];
        const timeStr = typeof now === 'number' && !isNaN(now) ? now.toFixed(0) : '0';
        console.log(`[SYNC] ${timeStr}ms ▶ viseme ${id} (理想 ${t}ms)`);
      }
      if (!audio.paused && idx < visemeTimeline.length) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // 语音合成
  async function speak() {
    if (!text.value.trim()) return;
    try {
      isProcessing.value = true;
      const audioBlob = await synthesizeSpeech(
        ssml.value || text.value,
        selectedVoice.value,
        Boolean(ssml.value),
      );
      audioUrl.value = URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      alert(t('animate.synthesisError'));
    } finally {
      isProcessing.value = false;
    }
  }

  return {
    isProcessing,
    audioUrl,
    animationTimer,
    visemeTimeline,
    onAnimate,
    startTimelineAnimation,
    handleViseme,
    syncVisemeWithAudio,
    speak
  };
}
