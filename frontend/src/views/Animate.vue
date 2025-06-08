<template>
  <div class="animate-page">
    <h1>{{ t('animate.title') }}</h1>
    
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
                {{ t(`animate.actions.${keyframe.action?.toLowerCase()}`) }}
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
        <button @click="addActionKeyframe" class="control-btn">
          {{ t('animate.timeline.addAction') }}
        </button>
        <button @click="addEmotionKeyframe" class="control-btn">
          {{ t('animate.timeline.addEmotion') }}
        </button>
        <button @click="clearTimeline" class="control-btn danger">
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
            type="number"
            v-model="selectedKeyframe.time"
            min="0"
            max="30"
            step="0.1"
            @input="validateKeyframeTime"
          />
        </div>
        <div v-if="selectedKeyframe.type === 'action'" class="form-group">
          <label>{{ t('animate.timeline.action') }}</label>
          <select v-model="selectedKeyframe.action">
            <option v-for="action in actions" :key="action" :value="action">
              {{ t(`animate.actions.${action.toLowerCase()}`) }}
            </option>
          </select>
        </div>
        <div v-if="selectedKeyframe.type === 'emotion'" class="form-group">
          <label>{{ t('animate.timeline.emotion') }}</label>
          <select v-model="selectedKeyframe.emotion">
            <option v-for="emotion in emotions" :key="emotion" :value="emotion">
              {{ t(`animate.emotions.${emotion.toLowerCase()}`) }}
            </option>
          </select>
        </div>
        <button @click="deleteKeyframe(selectedKeyframe)" class="delete-btn">
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
          @click="onAnimate" 
          class="generate-btn" 
          :disabled="isProcessing || !text.trim()"
        >
          <span v-if="isProcessing" class="loading-spinner"></span>
          <span v-else>{{ t('animate.submit') }}</span>
        </button>
      </div>

      <div class="preview-section">
        <ModelViewer
          ref="modelViewer"
          :model-url="currentModel?.url"
          :emotion="currentEmotion"
          :action="currentAction"
        />
        <audio ref="audioPlayer" controls :src="audioUrl"></audio>
        <div class="preview-controls">
          <button 
            v-if="!isRecording" 
            @click="startRecording" 
            class="control-btn"
            :disabled="isProcessing || !audioUrl"
          >
            {{ t('animate.record') }}
          </button>
          <button 
            v-else 
            @click="stopRecording" 
            class="control-btn danger"
          >
            {{ t('animate.stopRecording') }}
          </button>
          <button 
            v-if="recordedVideoUrl" 
            @click="downloadVideo" 
            class="control-btn"
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelViewer from '../components/ModelViewer.vue';
import { synthesizeSpeech } from '../api/azureTTS';
import type { Model } from '../types/model';

interface Keyframe {
  id: string;
  time: number;
  type: 'action' | 'emotion';
  action?: string;
  emotion?: string;
}

const { t } = useI18n();
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);
const audioPlayer = ref<HTMLAudioElement | null>(null);
const text = ref('你好，我是机器人，这是一个小小的演示，大约持续20秒钟。');
const emotion = ref('Neutral');
const action = ref('Idle');
const isProcessing = ref(false);
const audioUrl = ref<string>('');
const charCount = ref(0);

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

// 模型状态
const currentModel = ref<Model | null>(null);
const currentEmotion = ref('Neutral');
const currentAction = ref('Idle');

// 可用的动作和表情
const actions = ['Idle', 'Walking', 'Running', 'Jump', 'Wave', 'Dance', 'Death', 'No', 'Punch', 'Sitting', 'Standing', 'Thumbs Up', 'Walk Jump', 'Yes'];
const emotions = ['Neutral', 'Angry', 'Surprised', 'Sad'];

// 监听文本变化，更新字符计数
watch(text, (newText) => {
  charCount.value = newText.length;
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

function onTrackClick(type: 'action' | 'emotion', event: MouseEvent) {
  const track = event.currentTarget as HTMLElement;
  const rect = track.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const time = ((clickX - 2) / (rect.width - 4)) * 30;
  
  if (type === 'action') {
    addActionKeyframe(time);
  } else {
    addEmotionKeyframe(time);
  }
}

function addActionKeyframe(time = 0) {
  const keyframe: Keyframe = {
    id: Date.now().toString(),
    time,
    type: 'action',
    action: 'Idle'
  };
  actionKeyframes.value.push(keyframe);
  selectedKeyframe.value = keyframe;
}

function addEmotionKeyframe(time = 0) {
  const keyframe: Keyframe = {
    id: Date.now().toString(),
    time,
    type: 'emotion',
    emotion: 'Neutral'
  };
  emotionKeyframes.value.push(keyframe);
  selectedKeyframe.value = keyframe;
}

function validateKeyframeTime() {
  if (!selectedKeyframe.value) return;
  selectedKeyframe.value.time = Math.max(0, Math.min(30, selectedKeyframe.value.time));
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

function deleteKeyframe(keyframe: Keyframe) {
  if (keyframe.type === 'action') {
    actionKeyframes.value = actionKeyframes.value.filter(k => k.id !== keyframe.id);
  } else {
    emotionKeyframes.value = emotionKeyframes.value.filter(k => k.id !== keyframe.id);
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

    if (audioPlayer.value) {
      audioPlayer.value.src = audioUrl.value;
      audioPlayer.value.onended = () => {
        isProcessing.value = false;
        currentEmotion.value = 'Neutral';
        currentAction.value = 'Idle';
      };
      await audioPlayer.value.play();
    }
  } catch (error) {
    console.error('Failed to synthesize speech:', error);
    alert(t('animate.synthesisError'));
    isProcessing.value = false;
  }
}

async function startRecording() {
  try {
    if (!audioUrl.value) {
      alert(t('animate.recordingTip'));
      return;
    }

    const modelViewer = document.querySelector('model-viewer') as any;
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

    mediaRecorder.value.ondataavailable = (event) => {
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
      context.drawImage(modelViewer, 0, 0, canvas.width, canvas.height);
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