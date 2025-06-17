<template>
  <div class="animate-page">
    <h1>{{ t('animate.title') }}</h1>

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

    <!-- <div class="viewer-container">
      <ModelViewer
        ref="modelViewer"
        :model-url="selectedModel?.url || '/models/default.glb'"
        :auto-rotate="true"
        :show-controls="true"
      />
    </div> -->

    <!-- 时间轴编辑器 -->
    <div class="timeline-editor">
      <h3>{{ t('animate.timeline.title') }}</h3>
      <div class="timeline-container">
        <div class="timeline-header">
          <div class="track-label">{{ t('animate.timeline.time') }}</div>
          <div class="timeline-ruler">
            <div
              v-for="i in 31"
              :key="i"
              class="time-marker"
              :style="{ left: `${(i - 1) * 3.33}%` }"
            >
              {{ i - 1 }}s
            </div>
          </div>
        </div>
        <div class="timeline-tracks">
          <div class="track">
            <div class="track-label">{{ t('animate.timeline.action') }}</div>
            <div class="track-content" @click="onTrackClick('action', $event)">
              <div
                v-for="keyframe in actionKeyframes"
                :key="keyframe.id"
                class="keyframe action-keyframe"
                :style="{ left: `${keyframe.time * 3.33}%` }"
                @click.stop="selectKeyframe(keyframe)"
                @mousedown="startDrag(keyframe, $event)"
              >
                {{
                  t(
                    `animate.actions.${keyframe.action ? keyframe.action.charAt(0).toLowerCase() + keyframe.action.slice(1) : ''}`,
                  )
                }}
              </div>
            </div>
          </div>
          <div class="track">
            <div class="track-label">{{ t('animate.timeline.emotion') }}</div>
            <div class="track-content" @click="onTrackClick('emotion', $event)">
              <div
                v-for="keyframe in emotionKeyframes"
                :key="keyframe.id"
                class="keyframe emotion-keyframe"
                :style="{ left: `${keyframe.time * 3.33}%` }"
                @click.stop="selectKeyframe(keyframe)"
                @mousedown="startDrag(keyframe, $event)"
              >
                {{ t(`animate.emotions.${keyframe.emotion?.toLowerCase()}`) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="timeline-controls">
        <button class="control-btn" @click="() => addActionKeyframe()">
          {{ t('animate.timeline.addAction') }}
        </button>
        <button class="control-btn" @click="() => addEmotionKeyframe()">
          {{ t('animate.timeline.addEmotion') }}
        </button>
        <button class="control-btn danger" @click="clearTimeline">
          {{ t('animate.timeline.clear') }}
        </button>
      </div>
    </div>

    <!-- 关键帧编辑器 -->
    <div v-if="selectedKeyframe" class="keyframe-editor">
      <h4>{{ t('animate.timeline.editKeyframe') }}</h4>
      <div class="editor-content">
        <div class="form-group">
          <label>{{ t('animate.timeline.time') }}</label>
          <input
            min="0"
            max="30"
            step="0.1"
            class="w-20 px-2 py-1 border rounded"
            type="number"
            :value="selectedKeyframe.time"
            @input="handleTimeInput"
          />
        </div>
        <div v-if="selectedKeyframe.type === 'action'" class="form-group">
          <label>{{ t('animate.timeline.action') }}</label>
          <select
            class="form-control"
            :value="selectedKeyframe.action"
            @change="handleActionSelect"
          >
            <option v-for="action in actions" :key="action" :value="action">
              {{ t(`animate.actions.${action.charAt(0).toLowerCase() + action.slice(1)}`) }}
            </option>
          </select>
        </div>
        <div v-if="selectedKeyframe.type === 'emotion'" class="form-group">
          <label>{{ t('animate.timeline.emotion') }}</label>
          <select
            class="form-control"
            :value="selectedKeyframe.emotion"
            @change="handleEmotionSelect"
          >
            <option v-for="emotion in emotions" :key="emotion" :value="emotion">
              {{ t(`animate.emotions.${emotion.toLowerCase()}`) }}
            </option>
          </select>
        </div>
        <button class="delete-btn" @click="deleteKeyframe(selectedKeyframe)">
          {{ t('animate.timeline.delete') }}
        </button>
      </div>
    </div>

    <div class="animate-content">
      <div class="form-section">
        <div class="form-group">
          <label>{{ t('animate.text') }}</label>
          <textarea
            v-model="text"
            :placeholder="t('animate.textPlaceholder')"
            maxlength="180"
            :disabled="isProcessing"
          ></textarea>
          <div class="char-count" :class="{ 'near-limit': charCount > 150 }">
            {{ charCount }}/180
          </div>
          <button class="control-btn" @click="onGenerateSSML">
            {{ t('animate.timeline.generateSSML') }}
          </button>

          <!-- SSML 编辑器 -->
          <textarea v-model="ssml" rows="8" class="ssml-textarea" />

          <!-- 语音选择 -->
          <div class="form-group">
            <label>{{ t('animate.voice') }}</label>
            <select v-model="selectedVoice" class="form-control">
              <option v-for="voice in filteredVoices" :key="voice.name" :value="voice.name">
                {{ voice.label }}
              </option>
            </select>
          </div>
        </div>
        <button class="generate-btn" :disabled="isProcessing || !text.trim()" @click="onAnimate">
          <span v-if="isProcessing" class="loading-spinner"></span>
          <span v-else>{{ t('animate.submit') }}</span>
        </button>
      </div>

      <div class="preview-section">
        <ModelViewer
          ref="modelViewer"
          :model-url="selectedModel?.url"
          :emotion="currentEmotion"
          :action="currentAction"
        />
        <audio ref="audioPlayer" controls :src="audioUrl"></audio>
        <div class="preview-controls">
          <button
            v-if="!isRecording"
            class="control-btn"
            :disabled="isProcessing || !audioUrl"
            @click="startRecording"
          >
            {{ t('animate.record') }}
          </button>
          <button v-else class="control-btn danger" @click="stopRecording">
            {{ t('animate.stopRecording') }}
          </button>
          <button v-if="recordedVideoUrl" class="control-btn" @click="downloadVideo">
            {{ t('animate.download') }}
          </button>
          <div v-if="!audioUrl" class="recording-tip">
            {{ t('animate.recordingTip') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 测试用：典型情绪示例表格 -->
    <div class="sample-table">
      <h3>{{ t('animate.sampleSentences') }}</h3>
      <table>
        <thead>
          <tr>
            <th>{{ t('animate.emotion') }}</th>
            <th>{{ t('animate.text') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sample in samples"
            :key="sample.text"
            @click="applySample(sample.text)"
            class="sample-row"
          >
            <td>{{ sample.emotion }}</td>
            <td>{{ sample.text }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Composer } from 'vue-i18n';
import ModelViewer from '@/components/ModelViewer.vue';
import {
  synthesizeSpeech as synthesizeSpeechFront,
  availableVoices,
  fetchVoices,
  type VoiceOption,
} from '@/api/azureTTS';
import { synthesizeSpeech as synthesizeSpeechBackend } from '@/api/BackendAzureTTS';
import type { Model } from '@/types/model';
import { getModels } from '@/api/model';
import { generateSSML as generateSSMLBackend } from '@/api/openai';
import { generateSSMLFront } from '@/api/openaiFrontend';

interface Keyframe {
  id: string;
  time: number;
  type: 'action' | 'emotion';
  action?: string;
  emotion?: string;
}

const { t } = useI18n() as Composer;
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);
const readyModels = ref<Model[]>([]);
const selectedModel = ref<Model | null>(null);
const currentEmotion = ref('');
const currentAction = ref('Idle');
const text = ref('你好，我是数字人，这是一个小小的演示，大约持续5秒钟。');

const actions = [
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
] as const;

const emotions = ['Angry', 'Surprised', 'Sad'] as const;

const charCount = computed({
  get: () => text.value.length,
  set: (value: number) => {
    if (value > 180) {
      text.value = text.value.slice(0, 180);
    }
  },
});

// Azure TTS voice list (reactive)
const voices = ref<VoiceOption[]>(availableVoices);

// Only display voices that start with zh-CN
const filteredVoices = computed(() => voices.value.filter((v) => v.name.startsWith('zh-CN')));

const selectedVoice = ref<string>(filteredVoices.value[0]?.name || 'zh-CN-XiaoxiaoNeural');

// Try to fetch full voices list from Azure when component is mounted
async function loadVoices() {
  try {
    const remote = await fetchVoices();
    if (Array.isArray(remote) && remote.length) {
      // Keep only zh-CN voices for UI
      const zhVoices = remote.filter((v) => v.name.startsWith('zh-CN'));
      if (zhVoices.length) {
        voices.value = zhVoices;
      } else {
        voices.value = remote;
      }
      // Ensure selected voice exists
      if (!filteredVoices.value.find((v) => v.name === selectedVoice.value)) {
        selectedVoice.value = filteredVoices.value[0]?.name || selectedVoice.value;
      }
    }
  } catch (err) {
    console.warn('Unable to fetch voices list, fallback to static list.', err);
  }
}

onMounted(() => {
  loadVoices();
  fetchReadyModels();
  // 监听 audio 播放事件
  nextTick(() => {
    if (audioPlayer.value) {
      audioPlayer.value.addEventListener('play', handleAudioPlay);
    }
  });
});

// 获取就绪状态的模型列表
async function fetchReadyModels() {
  try {
    const models = await getModels();
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
function selectModel(model: Model) {
  selectedModel.value = model;
  currentEmotion.value = '';
}
const isProcessing = ref(false);
const audioUrl = ref<string>('');

// 时间轴相关
const actionKeyframes = ref<Keyframe[]>([]);
const emotionKeyframes = ref<Keyframe[]>([]);
const selectedKeyframe = ref<Keyframe | null>(null);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartTime = ref(0);

// 视频录制相关
const isRecording = ref(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<Blob[]>([]);
const recordedVideoUrl = ref<string>('');

// 动画定时器
const animationTimer = ref<number | null>(null);
const audioPlayer = ref<HTMLAudioElement | null>(null);

const ssml = ref(''); // 存放生成的 SSML
const isGeneratingSSML = ref(false); // 按钮 loading 状态

// Azure 语音合成依旧按构建模式区分：生产默认走后端代理
const useFrontendAzure = Boolean(import.meta.env.VITE_AZURE_SPEECH_KEY);
const synthesizeSpeech = useFrontendAzure ? synthesizeSpeechFront : synthesizeSpeechBackend;

// 如果配置了前端 OpenAI KEY，则优先在浏览器直接调用 OpenAI，避免跨域 / 404
const useFrontendOpenAI = Boolean(import.meta.env.VITE_OPENAI_API_KEY);
const generateSSML = useFrontendOpenAI ? generateSSMLFront : generateSSMLBackend;

onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.removeEventListener('play', handleAudioPlay);
  }
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
  }
  if (recordedVideoUrl.value) {
    URL.revokeObjectURL(recordedVideoUrl.value);
  }
});

function handleAudioPlay() {
  if (audioPlayer.value) {
    startTimelineAnimation(audioPlayer.value);
  }
}

async function onAnimate() {
  if (!text.value.trim()) {
    alert(t('animate.textRequired'));
    return;
  }

  if (text.value.length > 180) {
    alert(t('animate.textTooLong'));
    return;
  }

  try {
    isProcessing.value = true;
    const audioBlob = await synthesizeSpeech(
      ssml.value || text.value,
      selectedVoice.value,
      Boolean(ssml.value),
    );
    audioUrl.value = URL.createObjectURL(audioBlob);

    // 播放音频并驱动动画
    nextTick(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
        startTimelineAnimation(audio);
      }
    });
  } catch (error) {
    console.error('Failed to synthesize speech:', error);
    alert(t('animate.synthesisError'));
  } finally {
    isProcessing.value = false;
  }
}

function startRecording() {
  if (!modelViewer.value) {
    alert(t('animate.recordingError'));
    return;
  }

  if (!audioUrl.value) {
    alert(t('animate.recordingTip'));
    return;
  }

  try {
    // 获取模型预览区域的视频流
    const videoStream = modelViewer.value.getVideoStream();
    if (!videoStream) {
      throw new Error('Failed to get video stream');
    }

    // 获取音频元素
    const audioElement = audioPlayer.value;
    if (!audioElement) {
      throw new Error('Audio element not found');
    }

    // 创建音频上下文
    const audioContext = new AudioContext();
    const audioDestination = audioContext.createMediaStreamDestination();
    const audioSource = audioContext.createMediaElementSource(audioElement);
    audioSource.connect(audioDestination);
    audioSource.connect(audioContext.destination); // 保持音频可听

    // 合并视频和音频流
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ]);

    // 创建 MediaRecorder 实例
    mediaRecorder.value = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 2500000, // 2.5Mbps
    });

    // 收集录制的数据块
    recordedChunks.value = [];
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data);
      }
    };

    // 录制完成后的处理
    mediaRecorder.value.onstop = () => {
      const blob = new Blob(recordedChunks.value, {
        type: 'video/webm',
      });
      recordedVideoUrl.value = URL.createObjectURL(blob);
      isRecording.value = false;

      // 清理音频上下文
      audioContext.close();
    };

    // 开始录制
    mediaRecorder.value.start(100); // 每100ms收集一次数据
    isRecording.value = true;

    // 重置并播放音频
    audioElement.currentTime = 0;

    // 添加音频结束事件监听器
    const handleAudioEnded = () => {
      if (isRecording.value) {
        stopRecording();
      }
      audioElement.removeEventListener('ended', handleAudioEnded);
    };
    audioElement.addEventListener('ended', handleAudioEnded);

    audioElement.play().catch((error) => {
      console.error('Failed to play audio:', error);
      stopRecording();
    });
  } catch (error) {
    console.error('Failed to start recording:', error);
    alert(t('animate.recordingError'));
    isRecording.value = false;
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    // 停止所有视频轨道
    mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());

    // 停止音频播放
    if (audioPlayer.value) {
      audioPlayer.value.pause();
      audioPlayer.value.currentTime = 0;
    }
  }
}

function downloadVideo() {
  if (!recordedVideoUrl.value) {
    alert(t('animate.noVideoToDownload'));
    return;
  }

  const a = document.createElement('a');
  a.href = recordedVideoUrl.value;
  a.download = `avatar-animation-${new Date().toISOString()}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 启动时间轴动画
function startTimelineAnimation(audio: HTMLAudioElement) {
  let lastAction = currentAction.value;
  let lastEmotion = currentEmotion.value;

  // 清理旧定时器
  if (animationTimer.value) {
    clearInterval(animationTimer.value);
    animationTimer.value = null;
  }

  animationTimer.value = window.setInterval(() => {
    const t = audio.currentTime;
    // 找到 <= 当前时间的最新动作/表情关键帧
    const actionFrame = [...actionKeyframes.value]
      .filter((k) => k.time <= t)
      .sort((a, b) => b.time - a.time)[0];
    const emotionFrame = [...emotionKeyframes.value]
      .filter((k) => k.time <= t)
      .sort((a, b) => b.time - a.time)[0];

    // 切换动作
    if (actionFrame && actionFrame.action && actionFrame.action !== lastAction) {
      currentAction.value = actionFrame.action;
      if (modelViewer.value) modelViewer.value.playAnimation(actionFrame.action);
      lastAction = actionFrame.action;
    }
    // 切换表情
    if (emotionFrame && emotionFrame.emotion && emotionFrame.emotion !== lastEmotion) {
      currentEmotion.value = emotionFrame.emotion;
      if (modelViewer.value) modelViewer.value.updateEmotion(emotionFrame.emotion);
      lastEmotion = emotionFrame.emotion;
    }

    // 音频播放结束，清理定时器并重置为 Idle
    if (audio.ended) {
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
}

// 监听文本变化，更新字符计数
watch(text, (newText: string) => {
  if (newText.length > 180) {
    text.value = newText.slice(0, 180);
  }
});

// 清理函数
onUnmounted(() => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
  }
  if (recordedVideoUrl.value) {
    URL.revokeObjectURL(recordedVideoUrl.value);
  }
});

function startDrag(keyframe: Keyframe, event: MouseEvent) {
  if (!keyframe) return;

  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartTime.value = keyframe.time;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value || !selectedKeyframe.value) return;

  const deltaX = event.clientX - dragStartX.value;
  const track = document.querySelector('.track-content') as HTMLElement;
  const rect = track?.getBoundingClientRect();
  if (!rect) return;

  const deltaTime = (deltaX / (rect.width - 4)) * 30;
  const newTime = Math.max(0, Math.min(30, dragStartTime.value + deltaTime));

  selectedKeyframe.value.time = Number(newTime.toFixed(1));
}

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

function _validateKeyframeTime(event: Event) {
  if (!selectedKeyframe.value) return;
  const input = event.target as HTMLInputElement;
  const value = parseFloat(input.value);
  if (!isNaN(value)) {
    selectedKeyframe.value.time = Math.max(0, Math.min(30, value));
  }
}

function clearTimeline() {
  if (confirm(t('animate.timeline.confirmClear'))) {
    actionKeyframes.value = [];
    emotionKeyframes.value = [];
    selectedKeyframe.value = null;
  }
}

function selectKeyframe(keyframe: Keyframe) {
  selectedKeyframe.value = keyframe;
  // 新增：同步当前动作/表情
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

function _handleTextChange(newText: string) {
  text.value = newText;
}

// 处理关键帧选择
function _handleKeyframeSelect(keyframe: Keyframe) {
  selectedKeyframe.value = { ...keyframe };
}

// 处理键盘事件
function _handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    speak();
  }
}

// 处理表情变化
function _handleEmotionChange(key: string) {
  // 先更新状态
  currentEmotion.value = key;

  // 然后更新模型
  if (modelViewer.value) {
    modelViewer.value.updateEmotion(key);
  }
}

// 处理动作变化
function _handleActionChange(key: string) {
  console.log('Action changed:', {
    from: currentAction.value,
    to: key,
  });

  // 先更新状态
  currentAction.value = key;

  // 然后更新模型
  if (modelViewer.value) {
    modelViewer.value.playAnimation(key);
  }
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

// 处理时间输入
function handleTimeInput(event: Event) {
  if (!selectedKeyframe.value) return;
  const input = event.target as HTMLInputElement;
  const value = parseFloat(input.value);
  if (!isNaN(value)) {
    selectedKeyframe.value.time = Math.max(0, Math.min(30, value));
  }
}

// 处理动作选择
function handleActionSelect(event: Event) {
  if (!selectedKeyframe.value) return;
  const select = event.target as HTMLSelectElement;
  const value = select.value;
  if (value && actions.includes(value as (typeof actions)[number])) {
    const updatedKeyframe = { ...selectedKeyframe.value, action: value };
    selectedKeyframe.value = updatedKeyframe;
    updateKeyframe(updatedKeyframe);
  }
}

// 处理表情选择
function handleEmotionSelect(event: Event) {
  if (!selectedKeyframe.value) return;
  const select = event.target as HTMLSelectElement;
  const value = select.value;
  if (value && emotions.includes(value as (typeof emotions)[number])) {
    const updatedKeyframe = { ...selectedKeyframe.value, emotion: value };

    selectedKeyframe.value = updatedKeyframe;
    updateKeyframe(updatedKeyframe);
  }
}

// 处理关键帧更新
function updateKeyframe(keyframe: Keyframe) {
  if (keyframe.type === 'action') {
    const index = actionKeyframes.value.findIndex((k) => k.id === keyframe.id);
    if (index !== -1) {
      actionKeyframes.value[index] = { ...keyframe };
      // 新增：如果当前选中，立即切换动作
      if (selectedKeyframe.value?.id === keyframe.id && keyframe.action) {
        currentAction.value = keyframe.action;
        if (modelViewer.value) modelViewer.value.playAnimation(keyframe.action);
      }
    }
  } else if (keyframe.type === 'emotion') {
    const index = emotionKeyframes.value.findIndex((k) => k.id === keyframe.id);
    if (index !== -1) {
      emotionKeyframes.value[index] = { ...keyframe };
      // 新增：如果当前选中，立即切换表情
      if (selectedKeyframe.value?.id === keyframe.id && keyframe.emotion) {
        currentEmotion.value = keyframe.emotion;
        if (modelViewer.value) modelViewer.value.updateEmotion(keyframe.emotion);
      }
    }
  }
}

async function onGenerateSSML() {
  if (!text.value.trim()) {
    alert(t('animate.textRequired'));
    return;
  }
  try {
    isGeneratingSSML.value = true;
    ssml.value = await generateSSML(text.value, selectedVoice.value);
    console.log('[SSML]', ssml.value);
    if (!ssml.value.trim()) {
      alert('SSML 生成结果为空，请稍后重试。');
      return;
    }
  } catch (e) {
    console.error(e);
    alert('SSML 生成失败');
  } finally {
    isGeneratingSSML.value = false;
  }
}

// 典型情绪示例
interface SampleSentence {
  emotion: string;
  text: string;
}

const samples: SampleSentence[] = [
  { emotion: 'empathetic', text: '非常抱歉让您有这样的体验' },
  { emotion: 'cheerful', text: '哇，太开心啦～感谢您喜欢我们的服务。' },
  { emotion: 'assistant', text: '别担心，袋袋来啦～我们一起查一下您的情况吧。' },
  { emotion: 'hopeful', text: '今天也要元气满满哦～袋袋祝您天天开心，一切顺利！' },
];

function applySample(sampleText: string) {
  text.value = sampleText;
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

// 定义颜色变量
$primary-color: #4caf50;
$danger-color: #f44336;
$text-color: #666;
$border-color: #ddd;
$background-color: #f5f5f5;

.animate-page {
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

  h4 {
    margin: 0 0 12px;
    color: #2c3e50;
    font-size: 1.2em;
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
.timeline-editor {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .timeline-container {
    margin-bottom: 16px;
  }

  .timeline-controls {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
}

.timeline-container {
  width: 100%;
  margin: 20px 0;
  background: white;
  border: 1px solid $border-color;
  border-radius: 4px;
  overflow: hidden;
}

.timeline-header {
  display: flex;
  align-items: stretch;
  margin-bottom: 15px;
}

.timeline-ruler {
  flex: 1;
  position: relative;
  height: 30px;
  background: $background-color;
  border-bottom: 1px solid $border-color;
  margin-left: 10px;
}

.track-label {
  width: 60px;
  padding: 0 10px;
  font-size: 14px;
  color: $text-color;
  text-align: right;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 30px;
}

.track {
  display: flex;
  align-items: stretch;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.track-content {
  flex: 1;
  position: relative;
  background: #fff;
  padding: 5px 0;
  cursor: pointer;
  min-height: 40px;
  margin-left: 10px;
}

.time-marker {
  position: absolute;
  width: 1px;
  height: 10px;
  background: #999;
  bottom: 0;
}

.time-marker::after {
  content: attr(data-time);
  position: absolute;
  bottom: 12px;
  left: -10px;
  font-size: 12px;
  color: #666;
}

.timeline-tracks {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.keyframe {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  min-width: 60px;
  text-align: left;
  user-select: none;
}

.action-keyframe {
  background: $primary-color;
  color: white;
}

.emotion-keyframe {
  background: #2196f3;
  color: white;
}

.keyframe-editor {
  background: #f8f8f8;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.editor-content {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.form-group {
  flex: 1;
}

.delete-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.animate-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 32px;

  .form-section {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .preview-section {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.form-group {
  margin-bottom: 15px;
}

textarea {
  width: 100%;
  min-height: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.char-count {
  text-align: right;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.char-count.near-limit {
  color: #f44336;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: color.adjust($primary-color, $lightness: -10%);
}

.control-btn {
  padding: 8px 16px;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: color.adjust($primary-color, $lightness: -10%);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  &.danger {
    background: $danger-color;

    &:hover {
      background: color.adjust($danger-color, $lightness: -10%);
    }
  }
}

.generate-btn {
  width: 100%;
  padding: 12px;
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: color.adjust($primary-color, $lightness: -10%);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
}

.preview-controls {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.recording-tip {
  color: $text-color;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ssml-textarea {
  width: 100%;
  resize: vertical;
  padding: 8px 12px;
  font-family: monospace;
  border: 1px solid #dcdcdc;
  border-radius: 6px;
}

.sample-table {
  margin-top: 32px;
}

.sample-table table {
  width: 100%;
  border-collapse: collapse;
}

.sample-table th,
.sample-table td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}

.sample-row {
  cursor: pointer;
}

.sample-row:hover {
  background: #f8f9fa;
}
</style>
