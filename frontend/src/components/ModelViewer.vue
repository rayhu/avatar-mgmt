<template>
  <div class="model-viewer" ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const props = defineProps<{
  modelUrl?: string;
  emotion?: string;
  action?: string;
}>();

const container = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let mixer: THREE.AnimationMixer | null = null;
let model: THREE.Group | null = null;
let clock = new THREE.Clock();

// 初始化场景
function initScene() {
  if (!container.value) return;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);

  // 添加轨道控制
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 添加环境光和平行光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // 加载默认模型
  loadModel('/models/default.glb');
}

// 加载模型
async function loadModel(url: string) {
  if (!scene) {
    console.error('Scene not initialized');
    return;
  }

  console.log('Loading model from:', url);
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync(url);
    console.log('Model loaded successfully:', gltf);
    
    // 清除旧模型
    if (model) {
      scene.remove(model);
    }
    
    model = gltf.scene;
    scene.add(model);
    console.log('Model added to scene');

    // 设置动画混合器
    if (gltf.animations.length > 0) {
      console.log('Animations found:', gltf.animations.map(a => a.name));
      mixer = new THREE.AnimationMixer(model);
      
      // 存储所有动画
      const animations = gltf.animations.reduce((acc, clip) => {
        acc[clip.name] = clip;
        return acc;
      }, {} as Record<string, THREE.AnimationClip>);
      
      // 默认播放 Idle 动画
      if (animations['Idle']) {
        const action = mixer.clipAction(animations['Idle']);
        action.play();
        console.log('Playing Idle animation');
      } else {
        console.warn('Idle animation not found');
      }
    } else {
      console.warn('No animations found in model');
    }

    // 调整相机位置
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    console.log('Model dimensions:', {
      center: center.toArray(),
      size: size.toArray()
    });
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
    
    camera.position.set(0, size.y * 0.5, cameraZ * 1.5);
    camera.lookAt(center);
    
    controls.target.copy(center);
    controls.update();
    
    console.log('Camera adjusted:', {
      position: camera.position.toArray(),
      target: controls.target.toArray()
    });
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

// 播放动画
function playAnimation(animationName: string) {
  if (!mixer) {
    console.warn('Animation mixer not initialized');
    return;
  }
  
  // 动画映射
  const animationMap: Record<string, string> = {
    'wave': 'Wave',
    'jump': 'Jump',
    'nod': 'Nod',
    'idle': 'Idle',
    'walking': 'Walking',
    'dance': 'Dance',
    'death': 'Death',
    'falling': 'Falling',
    'hit': 'Hit',
    'no': 'No',
    'punch': 'Punch',
    'running': 'Running',
    'sitting': 'Sitting',
    'standing': 'Standing',
    'thumbsup': 'ThumbsUp',
    'yes': 'Yes'
  };

  const targetAnimation = animationMap[animationName.toLowerCase()] || 'Idle';
  console.log('Playing animation:', targetAnimation);
  
  try {
    // 停止所有动画
    mixer.stopAllAction();
    
    // 直接尝试播放动画
    const action = mixer.clipAction(targetAnimation);
    if (action) {
      action.reset().play();
      console.log(`Animation "${targetAnimation}" started`);
    } else {
      console.warn(`Failed to create action for animation "${targetAnimation}"`);
    }
  } catch (error) {
    console.error('Error playing animation:', error);
  }
}

// 更新表情
function updateEmotion(emotion: string) {
  if (!model) return;
  
  // 表情映射
  const emotionMap: Record<string, string> = {
    'happy': 'Happy',
    'sad': 'Sad',
    'angry': 'Angry',
    'neutral': 'Neutral'
  };

  const targetEmotion = emotionMap[emotion.toLowerCase()] || 'Neutral';
  
  // 这里需要根据实际的表情系统来更新
  // 目前只是示例
  console.log('Updating emotion to:', targetEmotion);
}

// 暴露方法给父组件
defineExpose({
  playAnimation,
  updateEmotion
});

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  if (mixer) {
    mixer.update(clock.getDelta());
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// 处理窗口大小变化
function handleResize() {
  if (!container.value || !camera || !renderer) return;
  
  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

// 监听属性变化
watch(() => props.emotion, (newEmotion) => {
  if (newEmotion) {
    updateEmotion(newEmotion);
  }
});

watch(() => props.action, (newAction) => {
  if (newAction) {
    playAnimation(newAction);
  }
});

// 生命周期钩子
onMounted(() => {
  initScene();
  animate();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (container.value && renderer) {
    container.value.removeChild(renderer.domElement);
  }
  renderer?.dispose();
});
</script>

<style scoped>
.model-viewer {
  width: 100%;
  height: 400px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
</style> 