<template>
  <div class="animate-page">
    <h1>{{ t('animate.title') }}</h1>
    
    <!-- 时间轴编辑器 -->
    <div class="timeline-editor">
      <h3>{{ t('animate.timeline.title') }}</h3>
      <div class="timeline-container">
        <div class="timeline-ruler">
          <div v-for="i in 31" :key="i" class="time-marker" :style="{ left: `${(i-1) * 3.33}%` }">
            {{ i-1 }}s
          </div>
        </div>
        <div class="timeline-tracks">
          <div class="track">
            <div class="track-label">{{ t('animate.timeline.action') }}</div>
            <div class="track-content">
              <div
                v-for="keyframe in actionKeyframes"
                :key="keyframe.id"
                class="keyframe action-keyframe"
                :style="{ left: `${keyframe.time * 3.33}%` }"
                @click="selectKeyframe(keyframe)"
              >
                {{ keyframe.action }}
              </div>
            </div>
          </div>
          <div class="track">
            <div class="track-label">{{ t('animate.timeline.emotion') }}</div>
            <div class="track-content">
              <div
                v-for="keyframe in emotionKeyframes"
                :key="keyframe.id"
                class="keyframe emotion-keyframe"
                :style="{ left: `${keyframe.time * 3.33}%` }"
                @click="selectKeyframe(keyframe)"
              >
                {{ keyframe.emotion }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="timeline-controls">
        <button @click="addActionKeyframe">{{ t('animate.timeline.addAction') }}</button>
        <button @click="addEmotionKeyframe">{{ t('animate.timeline.addEmotion') }}</button>
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
          ></textarea>
          <div class="char-count" :class="{ 'near-limit': charCount > 150 }">
            {{ charCount }}/180
          </div>
        </div>
        <button @click="onAnimate" class="generate-btn" :disabled="isProcessing">
          {{ t('animate.submit') }}
        </button>
      </div>

      <div class="preview-section">
        <ModelViewer
          ref="modelViewer"
          :model-url="currentModel?.url"
          :emotion="currentEmotion"
          :action="currentAction"
        />
        <audio ref="audioPlayer" controls></audio>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ModelViewer from '../components/ModelViewer.vue';
import { synthesizeSpeech } from '../api/azureTTS';

const { t } = useI18n();

const text = ref('你好，我是机器人，这是一个小小的演示，大约持续20秒钟。');
const emotion = ref('Neutral');
const action = ref('Idle');
const isProcessing = ref(false);
const audioUrl = ref('');
const audioPlayer = ref<HTMLAudioElement | null>(null);
const modelViewer = ref<InstanceType<typeof ModelViewer> | null>(null);
const currentModel = ref({ url: '/models/default.glb' });
const currentEmotion = ref('Neutral');
const currentAction = ref('Idle');

// 添加字符限制
const MAX_CHARS = 180; // 约30秒的文本长度
const charCount = ref(0);

// 时间轴相关
interface Keyframe {
  id: string;
  time: number;
  type: 'action' | 'emotion';
  action?: string;
  emotion?: string;
}

const actionKeyframes = ref<Keyframe[]>([]);
const emotionKeyframes = ref<Keyframe[]>([]);
const selectedKeyframe = ref<Keyframe | null>(null);

const actions = [
  'Idle', 'Walking', 'Running', 'Jump', 'Wave', 'Dance',
  'Death', 'No', 'Punch', 'Sitting', 'Standing',
  'ThumbsUp', 'WalkJump', 'Yes'
];

const emotions = ['Neutral', 'Angry', 'Surprised', 'Sad'];

function addActionKeyframe() {
  const keyframe: Keyframe = {
    id: Date.now().toString(),
    time: 0,
    type: 'action',
    action: 'Idle'
  };
  actionKeyframes.value.push(keyframe);
  selectedKeyframe.value = keyframe;
}

function addEmotionKeyframe() {
  const keyframe: Keyframe = {
    id: Date.now().toString(),
    time: 0,
    type: 'emotion',
    emotion: 'Neutral'
  };
  emotionKeyframes.value.push(keyframe);
  selectedKeyframe.value = keyframe;
}

function selectKeyframe(keyframe: Keyframe) {
  selectedKeyframe.value = keyframe;
}

function deleteKeyframe(keyframe: Keyframe | null) {
  if (!keyframe) return;
  
  if (keyframe.type === 'action') {
    actionKeyframes.value = actionKeyframes.value.filter(
      k => k.id !== keyframe.id
    );
  } else {
    emotionKeyframes.value = emotionKeyframes.value.filter(
      k => k.id !== keyframe.id
    );
  }
  
  selectedKeyframe.value = null;
}

function updateCharCount() {
  charCount.value = text.value.length;
}

// 监听文本变化
watch(text, updateCharCount);

async function onAnimate() {
  if (isProcessing.value || !text.value) return;
  
  if (text.value.length > MAX_CHARS) {
    alert(t('animate.textTooLong'));
    return;
  }
  
  isProcessing.value = true;
  audioUrl.value = '';
  
  try {
    // 1. 合成语音
    const audioBlob = await synthesizeSpeech(text.value);
    audioUrl.value = URL.createObjectURL(audioBlob);
    
    // 2. 播放动画和表情
    if (audioPlayer.value) {
      const audio = audioPlayer.value;
      audio.src = audioUrl.value;
      
      // 监听音频播放进度
      audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        
        // 更新动作
        const currentAction = actionKeyframes.value
          .filter(k => k.time <= currentTime)
          .sort((a, b) => b.time - a.time)[0];
        
        if (currentAction && modelViewer.value) {
          modelViewer.value.playAnimation(currentAction.action!);
        }
        
        // 更新表情
        const currentEmotion = emotionKeyframes.value
          .filter(k => k.time <= currentTime)
          .sort((a, b) => b.time - a.time)[0];
        
        if (currentEmotion && modelViewer.value) {
          modelViewer.value.updateEmotion(currentEmotion.emotion!);
        }
      });

      // 监听音频播放结束
      audio.addEventListener('ended', () => {
        if (modelViewer.value) {
          modelViewer.value.playAnimation('Idle');
          modelViewer.value.updateEmotion('Neutral');
        }
        isProcessing.value = false;
      });
      
      audio.play();
    }
  } catch (error) {
    console.error('Error generating animation:', error);
    isProcessing.value = false;
  }
}
</script>

<style lang="scss" scoped>
.animate-page {
  padding: 20px;
  max-width: 100%;
}

.timeline-editor {
  margin-bottom: 20px;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.timeline-container {
  width: 100%;
  margin: 20px 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.timeline-ruler {
  position: relative;
  height: 30px;
  background: #f0f0f0;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
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

.track {
  display: flex;
  height: 40px;
  border-bottom: 1px solid #eee;
  padding: 5px 0;
}

.track-label {
  width: 80px;
  padding: 10px;
  background: #f8f8f8;
  border-right: 1px solid #ddd;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.track-content {
  flex: 1;
  position: relative;
  background: #fff;
  padding: 5px 0;
}

.keyframe {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  min-width: 60px;
  text-align: center;
}

.action-keyframe {
  background: #4CAF50;
  color: white;
}

.emotion-keyframe {
  background: #2196F3;
  color: white;
}

.timeline-controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
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
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.form-section {
  flex: 1;
}

.preview-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.generate-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.generate-btn:hover {
  background: #45a049;
}
</style> 