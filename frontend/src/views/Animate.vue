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
            <ModelCard :preview-url="model.previewUrl" />
          </div>
          <div class="model-info">
            <h4>{{ model.name }}</h4>
          </div>
        </div>
      </div>
      <div v-else class="selected-model">
        <div class="model-preview">
          <ModelCard :preview-url="selectedModel.previewUrl" />
        </div>
        <div class="model-info">
          <h4>{{ selectedModel.name }}</h4>
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
            <!-- 桌面端：显示所有刻度 -->
            <div
              v-for="i in timeMarkers.all"
              :key="`desktop-${i}`"
              class="time-marker desktop-marker"
              :style="{ left: `${(i - 1) * 3.33}%` }"
            >
              {{ i - 1 }}s
            </div>
            <!-- 移动端：只显示主要刻度 -->
            <div
              v-for="i in timeMarkers.mobile"
              :key="`mobile-${i}`"
              class="time-marker mobile-marker"
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
                {{ t(getActionDisplayName(keyframe.action || '')) }}
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
                {{ t(getEmotionDisplayName(keyframe.emotion || '')) }}
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
              {{ t(getActionDisplayName(action)) }}
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
              {{ t(getEmotionDisplayName(emotion)) }}
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
            :disabled="animationProcessing"
          ></textarea>
          <div class="char-count" :class="{ 'near-limit': charCount > 150 }">
            {{ charCount }}/180
          </div>
          <button class="control-btn" @click="onGenerateSSML">
            {{ t('animate.timeline.generateSSML') }}
          </button>
          <button class="control-btn danger" @click="onClearSSML" style="margin-left: 8px">
            {{ t('animate.timeline.clearEmotionTags') }}
          </button>

          <!-- SSML 编辑器 -->
          <textarea v-model="ssml" rows="8" class="ssml-textarea" />

          <!-- 语音选择 -->
          <div class="form-group">
            <label>{{ t('animate.voice') }}</label>
            <select v-model="selectedVoice" class="form-control">
              <option
                v-for="voice in filteredVoices"
                :key="voice.name"
                :value="voice.name"
                :title="voice.styles ? voice.styles.join(', ') : ''"
              >
                {{ voice.label
                }}{{ voice.styles && voice.styles.length ? ' (' + voice.styles.length + ')' : '' }}
              </option>
            </select>
          </div>
        </div>
        <button class="generate-btn" :disabled="animationProcessing || !text.trim()" @click="() => { debugCurrentState(); onAnimate(); }">
          <span v-if="animationProcessing" class="loading-spinner"></span>
          <span v-else>{{ t('animate.submit') }}</span>
        </button>
        <!-- 调试按钮 -->
        <button class="control-btn" @click="debugCurrentState" style="margin-top: 8px; width: 100%;">
          🔍 调试状态检查
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
        <!-- 背景图片控制 -->
        <div class="background-controls">
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="image-input"
            :disabled="animationProcessing"
          />
          <button 
            class="control-btn secondary" 
            @click="() => imageInput?.click()"
            :disabled="animationProcessing"
          >
            🖼️ {{ t('animate.selectImage') }}
          </button>
          <button 
            v-if="backgroundImage"
            class="control-btn danger" 
            @click="clearBackgroundImage"
            :disabled="animationProcessing"
          >
            🗑️ {{ t('animate.clearImage') }}
          </button>
        </div>
        
        <!-- 背景控制面板 -->
        <div v-if="backgroundImage" class="background-control-panel">
          <h4>🎨 背景控制</h4>
          
          <!-- 距离控制 -->
          <div class="control-group">
            <label class="control-label">
              📏 距离: {{ (backgroundDistance || 0).toFixed(1) }}
            </label>
            <div class="control-row">
              <input
                type="range"
                min="-10"
                max="-0.5"
                step="0.1"
                v-model="backgroundDistance"
                @input="adjustBackgroundDistance"
                class="distance-slider"
                :disabled="animationProcessing"
              />
              <div class="preset-buttons">
                <button 
                  v-for="(preset, index) in presetDistances"
                  :key="preset.value"
                  @click="setBackgroundDistance(preset.value)"
                  :class="{ active: Math.abs(backgroundDistance - preset.value) < 0.1 }"
                  class="preset-btn"
                  :title="`快捷键: ${index + 1}`"
                >
                  {{ preset.icon }} {{ preset.label }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- 位置偏移控制 -->
          <div class="control-group">
            <label class="control-label">📍 位置偏移</label>
            <div class="offset-controls">
              <div class="offset-item">
                <span>X: {{ (backgroundOffset?.x || 0).toFixed(1) }}</span>
                <div class="offset-buttons">
                  <button @click="adjustOffset('x', -offsetStep)" :disabled="animationProcessing" title="Ctrl+←">←</button>
                  <button @click="adjustOffset('x', offsetStep)" :disabled="animationProcessing" title="Ctrl+→">→</button>
                </div>
              </div>
              <div class="offset-item">
                <span>Y: {{ (backgroundOffset?.y || 0).toFixed(1) }}</span>
                <div class="offset-buttons">
                  <button @click="adjustOffset('y', -offsetStep)" :disabled="animationProcessing" title="Ctrl+↑">↑</button>
                  <button @click="adjustOffset('y', offsetStep)" :disabled="animationProcessing" title="Ctrl+↓">↓</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 缩放控制 -->
          <div class="control-group">
            <label class="control-label">🔍 缩放: {{ (backgroundScale || 1).toFixed(2) }}</label>
            <div class="scale-controls">
              <button @click="adjustScale(-scaleStep)" :disabled="animationProcessing" title="Ctrl+-">-</button>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                v-model="backgroundScale"
                @input="adjustBackgroundScale"
                class="scale-slider"
                :disabled="animationProcessing"
              />
              <button @click="adjustScale(scaleStep)" :disabled="animationProcessing" title="Ctrl+=">+</button>
            </div>
          </div>
          
          <!-- 重置按钮 -->
          <div class="control-group">
            <button 
              class="reset-btn" 
              @click="resetBackgroundSettings"
              :disabled="animationProcessing"
              title="快捷键: R"
            >
              🔄 重置设置
            </button>
          </div>
          
          <!-- 快捷键提示 -->
          <div class="shortcut-tips">
            <small>
              💡 快捷键: Ctrl+方向键(位置) | Ctrl+/- (缩放) | 1-4(预设距离) | R(重置)
            </small>
          </div>
        </div>
        
        <!-- 背景图片预览 -->
        <div v-if="backgroundImage" class="background-preview">
          <img :src="backgroundImage" :alt="t('animate.backgroundPreview')" />
          <span class="background-name">{{ backgroundImageName }}</span>
        </div>

        <div class="preview-controls">
          <button
            v-if="!isRecording"
            class="control-btn"
            :disabled="animationProcessing || !audioUrl"
            @click="() => startRecording(modelViewer, audioPlayer, audioUrl, startTimelineAnimation, syncVisemeWithAudio)"
          >
            {{ t('animate.record') }}
          </button>
          <button v-else class="control-btn danger" @click="stopRecording">
            {{ t('animate.stopRecording') }}
          </button>
          <button v-if="recordedVideoUrl" class="control-btn" @click="downloadVideo">
            {{ t('animate.download') }}
          </button>
          <button 
            v-if="recordedVideoUrl || isRecording" 
            class="control-btn secondary" 
            @click="resetRecordingState"
            title="重置录制状态"
          >
            🔄 重置录制
          </button>
          <button 
            class="control-btn outline" 
            @click="checkRecordingState"
            title="检查录制状态（调试用）"
          >
            🔍 状态检查
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
import ModelCard from '@/components/ModelCard.vue';
import {
  synthesizeSpeech as synthesizeSpeechFront,
  availableVoices,
  fetchVoices,
  type VoiceOption,
} from '@/api/azureTTS';
import { synthesizeSpeech as synthesizeSpeechBackend } from '@/api/BackendAzureTTS';
import { generateSSMLBackend } from '@/api/openaiBackend';
import { generateSSMLFront } from '@/api/openaiFrontend';
import { getActionAnimations, getEmotionAnimations } from '@/config/animations';

// 导入组合式函数
import { useRecording } from '@/composables/useRecording';
import { useTimeline } from '@/composables/useTimeline';
import { useBackground } from '@/composables/useBackground';
import { useAnimation } from '@/composables/useAnimation';
import { useModelSelection } from '@/composables/useModelSelection';

interface Keyframe {
  id: string;
  time: number;
  type: 'action' | 'emotion';
  action?: string;
  emotion?: string;
}

const { t } = useI18n() as Composer;
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);
const text = ref('你好，我是数字人，这是一个小小的演示，大约持续5秒钟。');

// 使用组合式函数
const modelSelection = useModelSelection();
const { readyModels, selectedModel, currentEmotion, currentAction, fetchReadyModels } = modelSelection;

// 先创建processing状态的ref，稍后会被useAnimation覆盖
const isProcessing = ref(false);

const background = useBackground(modelViewer, isProcessing);
const {
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
} = background;

// 控制精度常量
const distanceStep = 0.1;
const offsetStep = 0.5;
const scaleStep = 0.1;

// 从配置文件获取动作和表情数据
const actionAnimations = getActionAnimations();
const emotionAnimations = getEmotionAnimations();

// 提取动作名称数组（用于下拉框）
const actions = computed(() => 
  actionAnimations
    .filter(anim => anim.enabled)
    .map(anim => anim.actualName)
);

// 提取表情名称数组（用于下拉框）
const emotions = computed(() => 
  emotionAnimations
    .filter(anim => anim.enabled)
    .map(anim => anim.actualName)
);

const charCount = computed({
  get: () => text.value.length,
  set: (value: number) => {
    if (value > 180) {
      text.value = text.value.slice(0, 180);
    }
  },
});

// 时间标记配置已移至 useTimeline 组合式函数中

// Azure TTS voice list (reactive)
const voices = ref<VoiceOption[]>(availableVoices);

// Only display voices that start with zh-CN
const filteredVoices = computed(() => voices.value.filter((v) => v.name.startsWith('zh-CN')));

const selectedVoice = ref<string>(filteredVoices.value.find(v => v.name === 'zh-CN-YunxiaNeural')?.name || 'zh-CN-YunxiaNeural');

// 当用户更换语音时，自动清空已生成的 SSML，避免内容与 voice 不匹配
watch(selectedVoice, () => {
  ssml.value = '';
});

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
  // 不再使用老的 handleAudioPlay
  nextTick(() => {
    /* no-op */
  });
  
  // 添加键盘快捷键监听
  document.addEventListener('keydown', handleKeyDown);
});

// 键盘快捷键支持
function handleKeyDown(event: KeyboardEvent) {
  // 只在有背景图片时启用快捷键
  if (!backgroundImage.value) return;
  
  // 检查是否在输入框中，如果是则不处理快捷键
  const target = event.target as HTMLElement;
  if (target && (
    target.tagName === 'INPUT' || 
    target.tagName === 'TEXTAREA' || 
    target.tagName === 'SELECT' ||
    target.contentEditable === 'true'
  )) {
    return;
  }
  
  let handled = false;
  
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'ArrowLeft':
        adjustOffset('x', -offsetStep);
        handled = true;
        break;
      case 'ArrowRight':
        adjustOffset('x', offsetStep);
        handled = true;
        break;
      case 'ArrowUp':
        adjustOffset('y', -offsetStep);
        handled = true;
        break;
      case 'ArrowDown':
        adjustOffset('y', offsetStep);
        handled = true;
        break;
      case '=':
      case '+':
        adjustScale(scaleStep);
        handled = true;
        break;
      case '-':
        adjustScale(-scaleStep);
        handled = true;
        break;
    }
  }
  
  // 数字键快速设置预设距离
  if (event.key >= '1' && event.key <= '4') {
    const index = parseInt(event.key) - 1;
    if (presetDistances[index]) {
      setBackgroundDistance(presetDistances[index].value);
      handled = true;
    }
  }
  
  // R键重置设置
  if (event.key === 'r' || event.key === 'R') {
    resetBackgroundSettings();
    handled = true;
  }
  
  // 只有在处理了快捷键时才阻止默认行为
  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
}

// 选择模型 - 使用组合式函数
function selectModel(model: any) {
  modelSelection.selectModel(model);
}

// 关键帧编辑函数
function handleTimeInput(event: Event) {
  if (!selectedKeyframe.value) return;
  const target = event.target as HTMLInputElement;
  const newTime = parseFloat(target.value);
  selectedKeyframe.value.time = newTime;
  updateKeyframe(selectedKeyframe.value);
}

function handleActionSelect(event: Event) {
  if (!selectedKeyframe.value || selectedKeyframe.value.type !== 'action') return;
  const target = event.target as HTMLSelectElement;
  selectedKeyframe.value.action = target.value;
  updateKeyframe(selectedKeyframe.value);
}

function handleEmotionSelect(event: Event) {
  if (!selectedKeyframe.value || selectedKeyframe.value.type !== 'emotion') return;
  const target = event.target as HTMLSelectElement;
  selectedKeyframe.value.emotion = target.value;
  updateKeyframe(selectedKeyframe.value);
}

// SSML 生成和清理函数
async function onGenerateSSML() {
  if (!text.value.trim()) {
    alert(t('animate.textRequired'));
    return;
  }

  try {
    isGeneratingSSML.value = true;
    const result = await generateSSML(text.value, selectedVoice.value);
    ssml.value = result || text.value;
  } catch (error) {
    console.error('Failed to generate SSML:', error);
    alert(t('animate.ssmlGenerationError') || 'SSML生成失败');
  } finally {
    isGeneratingSSML.value = false;
  }
}

function onClearSSML() {
  ssml.value = '';
}

// 示例句子数据
const samples = ref([
  { emotion: '高兴', text: '今天真是太开心了！阳光明媚，心情格外好。' },
  { emotion: '悲伤', text: '离别总是让人难过，但我们要学会坚强面对。' },
  { emotion: '愤怒', text: '这种不公平的待遇让我感到非常愤怒！' },
  { emotion: '惊讶', text: '哇，这个结果真是太出乎我的意料了！' },
  { emotion: '平静', text: '保持内心的平静，是面对困难最好的方式。' },
  { emotion: '兴奋', text: '终于要实现我的梦想了，我太兴奋了！' }
]);

// 应用示例句子
function applySample(sampleText: string) {
  text.value = sampleText;
}

// 调试函数：检查状态
function debugCurrentState() {
  const state = {
    text: text.value,
    textLength: text.value.length,
    isProcessing: animationProcessing.value,
    selectedModel: selectedModel.value,
    modelViewerExists: !!modelViewer.value,
    selectedVoice: selectedVoice.value,
    backgroundImage: !!backgroundImage.value,
    backgroundImageName: backgroundImageName.value,
    audioUrl: !!audioUrl.value,
    audioUrlValue: audioUrl.value,
    ssml: ssml.value,
    buttonDisabled: animationProcessing.value || !text.value.trim(),
    // 检查函数是否存在
    onAnimateExists: typeof onAnimate === 'function',
    synthesizeSpeechExists: typeof synthesizeSpeech === 'function',
    generateSSMLExists: typeof generateSSML === 'function',
    // 检查音频元素
    audioPlayerExists: !!audioPlayer.value,
    audioPlayerSrc: audioPlayer.value?.src || 'no src',
    audioPlayerCanPlay: (audioPlayer.value?.readyState ?? 0) >= 2
  };
  
  console.log('🔍 Current state debug:', state);
  
  // 检查是否有任何异常状态
  if (!state.onAnimateExists) {
    console.error('❌ onAnimate function is missing!');
  }
  if (!state.synthesizeSpeechExists) {
    console.error('❌ synthesizeSpeech function is missing!');
  }
  if (state.isProcessing) {
    console.warn('⚠️ Already processing, please wait...');
  }
  if (!state.audioPlayerExists) {
    console.warn('⚠️ Audio player ref is null!');
  }
  if (state.audioUrl && !state.audioPlayerSrc) {
    console.warn('⚠️ Audio URL exists but player has no src!');
  }
  
  return state;
}
// isProcessing 和 audioUrl 已移至 useAnimation 组合式函数中

// 时间轴相关
const timeline = useTimeline(
  actionAnimations,
  emotionAnimations,
  modelViewer,
  currentAction,
  currentEmotion
);
const {
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
  getEmotionDisplayName
} = timeline;

// 视频录制相关
const recording = useRecording();
const {
  isRecording,
  mediaRecorder,
  recordedChunks,
  recordedVideoUrl,
  startRecording,
  stopRecording,
  resetRecordingState,
  checkRecordingState,
  downloadVideo
} = recording;

// 动画定时器
const audioPlayer = ref<HTMLAudioElement | null>(null);

const ssml = ref(''); // 存放生成的 SSML
const isGeneratingSSML = ref(false); // 按钮 loading 状态

// 如果配置了前端 OpenAI KEY，则优先在浏览器直接调用 OpenAI，避免跨域 / 404
const useFrontendOpenAI = Boolean(import.meta.env.VITE_OPENAI_API_KEY);
const generateSSML = useFrontendOpenAI ? generateSSMLFront : generateSSMLBackend;

// Azure 语音合成依旧按构建模式区分：生产默认走后端代理
const useFrontendAzure = Boolean(import.meta.env.VITE_AZURE_SPEECH_KEY);
const synthesizeSpeech = useFrontendOpenAI ? synthesizeSpeechFront : synthesizeSpeechBackend;

// 使用动画组合式函数
const animation = useAnimation(
  text,
  ssml,
  selectedVoice,
  modelViewer,
  currentAction,
  currentEmotion,
  synthesizeSpeech,
  t,
  actionKeyframes,
  emotionKeyframes,
  audioPlayer
);
const {
  isProcessing: animationProcessing,
  audioUrl,
  animationTimer,
  visemeTimeline,
  onAnimate,
  startTimelineAnimation,
  handleViseme,
  syncVisemeWithAudio,
  speak
} = animation;

// 同步处理状态
watch(animationProcessing, (newValue) => {
  isProcessing.value = newValue;
});

onUnmounted(() => {
  // no play listener cleanup needed
  
  // 清理键盘事件监听器
  document.removeEventListener('keydown', handleKeyDown);
});

// 主要动画生成函数已移至 useAnimation 组合式函数中

// 开始录制函数已移至 useRecording 组合式函数中

// 录制相关函数已移至 useRecording 组合式函数中

// 启动时间轴动画函数已移至 useAnimation 组合式函数中





// 监听文本变化，更新字符计数
watch(text, (newText: string) => {
  if (newText.length > 180) {
    text.value = newText.slice(0, 180);
  }
});

// 录制相关函数已移至 useRecording 组合式函数中

// 清理函数
onUnmounted(() => {
  resetRecordingState();
});

// 时间轴相关函数已移至 useTimeline 组合式函数中

// 关键帧相关函数已移至 useTimeline 组合式函数中

// 关键帧更新和SSML相关函数已移至相应的组合式函数中

// 背景控制相关函数已移至 useBackground 组合式函数中
</script>

<style lang="scss" scoped>
@import '@/styles/animate.scss';
</style>
