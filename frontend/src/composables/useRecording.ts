import { ref, Ref } from 'vue';

export interface RecordingState {
  isRecording: Ref<boolean>;
  mediaRecorder: Ref<MediaRecorder | null>;
  recordedChunks: Ref<Blob[]>;
  recordedVideoUrl: Ref<string>;
  startRecording: (
    modelViewer: any, 
    audioPlayer: HTMLAudioElement | null, 
    audioUrl: string, 
    startTimelineAnimation: (audio: HTMLAudioElement) => void, 
    syncVisemeWithAudio: (audio: HTMLAudioElement) => void
  ) => Promise<void>;
  stopRecording: () => void;
  resetRecordingState: () => void;
  checkRecordingState: () => void;
  downloadVideo: () => void;
}

export function useRecording(): RecordingState {
  const isRecording = ref(false);
  const mediaRecorder = ref<MediaRecorder | null>(null);
  const recordedChunks = ref<Blob[]>([]);
  const recordedVideoUrl = ref<string>('');
  
  // 保存音频上下文和源，以避免重复创建
  let currentAudioContext: AudioContext | null = null;
  let currentAudioSource: MediaElementAudioSourceNode | null = null;
  let connectedAudioElement: HTMLAudioElement | null = null;
  
  // 保存当前录制格式信息
  let currentFileExtension = 'webm'; // 默认扩展名

  // 开始录制
  async function startRecording(
    modelViewer: any, 
    audioPlayer: HTMLAudioElement | null, 
    audioUrl: string, 
    startTimelineAnimation: (audio: HTMLAudioElement) => void, 
    syncVisemeWithAudio: (audio: HTMLAudioElement) => void
  ) {
    if (!modelViewer) {
      throw new Error('Model viewer not available');
    }

    if (!audioUrl) {
      throw new Error('Audio not available');
    }

    // 如果已经在录制，先停止
    if (isRecording.value) {
      console.log('⚠️ Already recording, stopping first...');
      stopRecording();
      // 等待一小段时间再开始新的录制
      setTimeout(() => {
        startRecording(modelViewer, audioPlayer, audioUrl, startTimelineAnimation, syncVisemeWithAudio);
      }, 100);
      return;
    }

    console.log('🎬 Starting recording with animation sync...');

    try {
      // 清理之前的录制状态
      if (mediaRecorder.value) {
        mediaRecorder.value.stop();
        mediaRecorder.value = null;
      }
      recordedChunks.value = [];
      
      // 获取模型预览区域的视频流
      const videoStream = modelViewer.getVideoStream();
      if (!videoStream) {
        throw new Error('Failed to get video stream');
      }
      
      console.log('📹 Video stream obtained:', {
        videoTracks: videoStream.getVideoTracks().length,
        videoTrackInfo: videoStream.getVideoTracks().map((track: MediaStreamTrack) => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState
        }))
      });

      // 获取音频元素
      const audioElement = audioPlayer;
      if (!audioElement) {
        throw new Error('Audio element not found');
      }

      // 创建或重用音频上下文
      let audioContext: AudioContext;
      let audioSource: MediaElementAudioSourceNode;
      
      // 如果已经有连接到同一个音频元素的上下文，重用它
      if (currentAudioContext && currentAudioSource && connectedAudioElement === audioElement) {
        console.log('🔄 Reusing existing audio context and source');
        audioContext = currentAudioContext;
        audioSource = currentAudioSource;
      } else {
        // 清理之前的连接
        if (currentAudioContext && currentAudioSource) {
          console.log('🧹 Cleaning up previous audio context');
          try {
            currentAudioSource.disconnect();
            currentAudioContext.close();
          } catch (error) {
            console.warn('⚠️ Error cleaning up audio context:', error);
          }
        }
        
        // 创建新的音频上下文和源
        console.log('🎵 Creating new audio context for element');
        audioContext = new AudioContext();
        audioSource = audioContext.createMediaElementSource(audioElement);
        
        // 保存当前连接
        currentAudioContext = audioContext;
        currentAudioSource = audioSource;
        connectedAudioElement = audioElement;
      }
      
      const audioDestination = audioContext.createMediaStreamDestination();
      
      // 断开之前的连接再重新连接
      try {
        audioSource.disconnect();
      } catch (error) {
        // 忽略断开连接的错误，可能没有之前的连接
      }
      
      audioSource.connect(audioDestination);
      audioSource.connect(audioContext.destination); // 保持音频可听

      // 合并视频和音频流
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);
      
      console.log('🎵 Combined stream created:', {
        totalTracks: combinedStream.getTracks().length,
        videoTracks: combinedStream.getVideoTracks().length,
        audioTracks: combinedStream.getAudioTracks().length,
        streamId: combinedStream.id
      });

      // 检查支持的视频格式并创建 MediaRecorder 实例
      let mimeType = '';
      let fileExtension = '';
      
      // 优先尝试 MP4 格式
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
        mimeType = 'video/mp4;codecs=h264,aac';
        fileExtension = 'mp4';
        console.log('✅ Using MP4 format with H.264 + AAC');
      } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
        fileExtension = 'mp4';
        console.log('✅ Using MP4 format with AVC1 + MP4A');
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
        mimeType = 'video/webm;codecs=h264,opus';
        fileExtension = 'webm';
        console.log('⚠️ Using WebM format with H.264 + Opus (MP4 not supported)');
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
        fileExtension = 'webm';
        console.log('⚠️ Using WebM format with VP9 + Opus (fallback)');
      } else {
        // 最后的备选方案
        mimeType = 'video/webm';
        fileExtension = 'webm';
        console.warn('⚠️ Using basic WebM format (limited codec support)');
      }
      
      // 保存当前文件扩展名以供下载使用
      currentFileExtension = fileExtension;
      
      console.log(`🎬 Selected format: ${mimeType}`);
      
      mediaRecorder.value = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5Mbps
      });

      // 收集录制的数据块
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data);
        }
      };

      // 录制完成后的处理
      mediaRecorder.value.onstop = () => {
        console.log('📹 MediaRecorder stopped, processing data...');
        const blob = new Blob(recordedChunks.value, {
          type: mimeType,
        });
        recordedVideoUrl.value = URL.createObjectURL(blob);
        isRecording.value = false;

        // 不立即关闭音频上下文，保留以供重用
        console.log('🎵 Keeping audio context for potential reuse');
        
        console.log(`✅ Recording completed in ${fileExtension.toUpperCase()} format`);
      };

      // 录制错误处理
      mediaRecorder.value.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        isRecording.value = false;
        throw new Error('Recording error occurred');
      };

      // 开始录制
      mediaRecorder.value.start(100); // 每100ms收集一次数据
      isRecording.value = true;

      // 重置并播放音频
      audioElement.currentTime = 0;

      // 添加音频结束事件监听器
      const handleAudioEnded = () => {
        if (isRecording.value) {
          console.log('🎵 Audio ended, stopping recording...');
          stopRecording();
        }
        audioElement.removeEventListener('ended', handleAudioEnded);
      };
      audioElement.addEventListener('ended', handleAudioEnded);

      // 播放音频并同步动画
      await audioElement.play();
      console.log('🎵 Recording audio started, syncing animation...');
      
      // 确保动画与录制同步
      startTimelineAnimation(audioElement);
      
      // 开始口型同步
      syncVisemeWithAudio(audioElement);
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      isRecording.value = false;
      
      // 清理可能创建的资源
      if (mediaRecorder.value) {
        mediaRecorder.value.stop();
        mediaRecorder.value = null;
      }
      throw error;
    }
  }

  // 停止录制
  function stopRecording() {
    console.log('🛑 Stopping recording...');
    
    // 重置录制状态
    isRecording.value = false;
    
    if (mediaRecorder.value) {
      try {
        // 如果录制器还在运行，停止它
        if (mediaRecorder.value.state === 'recording') {
          mediaRecorder.value.stop();
        }
        
        // 停止所有轨道
        if (mediaRecorder.value.stream) {
          mediaRecorder.value.stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
            console.log('🛑 Stopped track:', track.kind);
          });
        }
        
        // 清理录制器
        mediaRecorder.value = null;
      } catch (error) {
        console.error('❌ Error stopping MediaRecorder:', error);
      }
    }
    
    console.log('✅ Recording stopped and cleaned up');
  }

  // 重置录制状态
  function resetRecordingState() {
    console.log('🔄 Resetting recording state...');
    
    // 停止录制
    if (isRecording.value) {
      stopRecording();
    }
    
    // 清理录制的视频
    if (recordedVideoUrl.value) {
      URL.revokeObjectURL(recordedVideoUrl.value);
      recordedVideoUrl.value = '';
    }
    
    // 清理录制数据
    recordedChunks.value = [];
    
    // 清理音频上下文
    if (currentAudioContext && currentAudioSource) {
      console.log('🧹 Cleaning up audio context and source');
      try {
        currentAudioSource.disconnect();
        currentAudioContext.close();
      } catch (error) {
        console.warn('⚠️ Error cleaning up audio context:', error);
      }
      currentAudioContext = null;
      currentAudioSource = null;
      connectedAudioElement = null;
    }
    
    // 重置状态
    isRecording.value = false;
    mediaRecorder.value = null;
    
    console.log('✅ Recording state reset');
  }

  // 检查录制状态
  function checkRecordingState() {
    console.log('🔍 Recording state check:', {
      isRecording: isRecording.value,
      mediaRecorder: mediaRecorder.value ? {
        state: mediaRecorder.value.state,
        hasStream: !!mediaRecorder.value.stream
      } : null,
      recordedChunks: recordedChunks.value.length,
      recordedVideoUrl: !!recordedVideoUrl.value
    });
  }

  // 下载视频
  function downloadVideo() {
    if (!recordedVideoUrl.value) {
      throw new Error('No video to download');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `avatar-animation-${timestamp}.${currentFileExtension}`;
    
    const a = document.createElement('a');
    a.href = recordedVideoUrl.value;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    console.log(`📥 Downloaded video as: ${filename}`);
  }

  return {
    isRecording,
    mediaRecorder,
    recordedChunks,
    recordedVideoUrl,
    startRecording,
    stopRecording,
    resetRecordingState,
    checkRecordingState,
    downloadVideo
  };
}
