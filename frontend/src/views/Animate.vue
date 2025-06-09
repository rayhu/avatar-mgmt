<template>
  <div class="animate-page">
    <h1>{{ t('animate.title') }}</h1>
    

    <!-- 模型选择 -->
    <div class="model-selector">
      <h3>{{ t('modelManagement.modelSelection') }}</h3>
      <div v-if="!selectedModel" class="model-list">
        <div v-for="model in readyModels" :key="model.id" class="model-card" @click="selectModel(model)">
          <div class="model-preview">
            <ModelViewer
              :model-url="model.url"
              :auto-rotate="true"
              :show-controls="false"
            />
          </div>
          <div class="model-info">
            <h4>{{ model.name }}</h4>
            <p>{{ model.description }}</p>
          </div>
        </div>
      </div>
      <div v-else class="selected-model">
        <div class="model-preview">
          <ModelViewer
            :model-url="selectedModel.url"
            :auto-rotate="true"
            :show-controls="false"
          />
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
            <div v-for="i in 31" :key="i" class="time-marker" :style="{ left: `${(i-1) * 3.33}%` }">
              {{ i-1 }}s
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
                {{ t(`animate.actions.${keyframe.action ? keyframe.action.charAt(0).toLowerCase() + keyframe.action.slice(1) : ''}`) }}
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
        </div>
        <button 
          class="generate-btn" 
          :disabled="isProcessing || !text.trim()" 
          @click="onAnimate"
        >
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
          <button 
            v-else 
            class="control-btn danger" 
            @click="stopRecording"
          >
            {{ t('animate.stopRecording') }}
          </button>
          <button 
            v-if="recordedVideoUrl" 
            class="control-btn" 
            @click="downloadVideo"
          >
            {{ t('animate.download') }}
          </button>
          <div v-if="!audioUrl" class="recording-tip">
            {{ t('animate.recordingTip') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Composer } from 'vue-i18n';
import ModelViewer from '@/components/ModelViewer.vue';
import { synthesizeSpeech } from '@/api/azureTTS';
import type { Model } from '@/types/model';
import { getModels } from '@/api/model';

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
  'Yes'
] as const;

const emotions = [
  'Angry',
  'Surprised',
  'Sad'
] as const;

const charCount = computed({
  get: () => text.value.length,
  set: (value: number) => {
    if (value > 180) {
      text.value = text.value.slice(0, 180);
    }
  }
});

onMounted(() => {
  fetchReadyModels();
});

// 获取就绪状态的模型列表
async function fetchReadyModels() {
  try {
    const models = await getModels();
    if (Array.isArray(models)) {
      readyModels.value = models.filter(model => model.status === 'ready');
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
    action: 'Idle'
  };
  actionKeyframes.value.push(keyframe);
  selectedKeyframe.value = keyframe;
}

function addEmotionKeyframe(time: number = 0) {
  const keyframe: Keyframe = {
    id: Date.now().toString(),
    time,
    type: 'emotion',
    emotion: 'Sad'
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
    const audioBlob = await synthesizeSpeech(text.value);
    audioUrl.value = URL.createObjectURL(audioBlob);

    if (modelViewer.value) {
      console.log('Updating model state:', {
        emotion: 'Sad',
        action: 'Idle'
      });
      
      // 直接更新状态，不触发事件
      currentEmotion.value = 'Sad';
      currentAction.value = 'Idle';
      
      // 然后更新模型
      modelViewer.value.updateEmotion('Sad');
      modelViewer.value.playAnimation('Idle');
    } else {
      console.warn('ModelViewer not initialized');
    }
  } catch (error) {
    console.error('Failed to synthesize speech:', error);
    alert(t('animate.synthesisError'));
  } finally {
    isProcessing.value = false;
  }
}

async function startRecording() {
  try {
    if (!audioUrl.value) {
      alert(t('animate.recordingTip'));
      return;
    }

    const modelViewer = document.querySelector('model-viewer') as HTMLElement;
    if (!modelViewer) {
      throw new Error('Model viewer not found');
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = modelViewer.clientWidth;
    canvas.height = modelViewer.clientHeight;

    const stream = canvas.captureStream(30);
    mediaRecorder.value = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    });

    mediaRecorder.value.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data);
      }
    };

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(recordedChunks.value, {
        type: 'video/webm'
      });
      recordedVideoUrl.value = URL.createObjectURL(blob);
    };

    recordedChunks.value = [];
    mediaRecorder.value.start();

    const captureFrame = () => {
      if (!isRecording.value) return;
      // FIXME: 这里假设 modelViewer 实际上是 canvas 元素，后续如有自定义渲染需调整
      context.drawImage(modelViewer as unknown as HTMLCanvasElement, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(captureFrame);
    };

    isRecording.value = true;
    captureFrame();
  } catch (error) {
    console.error('Failed to start recording:', error);
    alert(t('animate.recordError'));
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
  }
}

function downloadVideo() {
  if (!recordedVideoUrl.value) return;

  const link = document.createElement('a');
  link.href = recordedVideoUrl.value;
  link.download = `avatar-animation-${new Date().toISOString()}.webm`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function _playAnimation(animation: string) {
  if (modelViewer.value) {
    console.log('Playing animation:', {
      animation,
      currentAction: currentAction.value,
      modelViewer: !!modelViewer.value
    });
    
    modelViewer.value.playAnimation(animation);
    currentAction.value = animation;
  } else {
    console.warn('ModelViewer not initialized when trying to play animation:', animation);
  }
}

function _updateEmotion(emotion: string) {
  if (modelViewer.value) {
    modelViewer.value.updateEmotion(emotion)
    currentEmotion.value = emotion
  }
}

// 处理文本变化
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
    to: key
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
    const audioBlob = await synthesizeSpeech(text.value);
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
  if (value && actions.includes(value as typeof actions[number])) {
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
  if (value && emotions.includes(value as typeof emotions[number])) {
    const updatedKeyframe = { ...selectedKeyframe.value, emotion: value };
    selectedKeyframe.value = updatedKeyframe;
    updateKeyframe(updatedKeyframe);
  }
}

// 处理关键帧更新
function updateKeyframe(keyframe: Keyframe) {
  if (keyframe.type === 'action') {
    const index = actionKeyframes.value.findIndex(k => k.id === keyframe.id);
    if (index !== -1) {
      actionKeyframes.value[index] = { ...keyframe };
    }
  } else if (keyframe.type === 'emotion') {
    const index = emotionKeyframes.value.findIndex(k => k.id === keyframe.id);
    if (index !== -1) {
      emotionKeyframes.value[index] = { ...keyframe };
    }
  }
}
</script>

<style lang="scss" scoped>
// 定义颜色变量
$primary-color: #4CAF50;
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
  background: #2196F3;
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
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #45a049;
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
    background: darken($primary-color, 10%);
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
  
  &.danger {
    background: $danger-color;
    
    &:hover {
      background: darken($danger-color, 10%);
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
    background: darken($primary-color, 10%);
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
</style> 
