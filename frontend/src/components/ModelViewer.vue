<template>
  <div ref="container" class="model-viewer">
    <!-- 加载状态覆盖层 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">
          <h3>{{ t('modelViewer.loading.title') }}</h3>
          <p>{{ t('modelViewer.loading.subtitle') }}</p>
          <div class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ Math.round(loadingProgress) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态覆盖层 -->
    <div v-if="loadError" class="error-overlay">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>{{ t('modelViewer.error.title') }}</h3>
        <p>{{ loadError }}</p>
        <button class="retry-btn" @click="retryLoad">
          {{ t('common.retry') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const { t } = useI18n();

const props = defineProps<{
  modelUrl?: string;
  emotion?: string;
  action?: string;
  autoRotate?: boolean;
  showControls?: boolean;
}>();

const container = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: InstanceType<typeof OrbitControls>;
let mixer: THREE.AnimationMixer | null = null;
let model: THREE.Group | null = null;
let clock = new THREE.Clock();
let availableAnimations: THREE.AnimationClip[] = [];
let animationLoop: number | null = null;
let currentAnimationAction: THREE.AnimationAction | null = null;
let lastVisemeIndex: number | null = null;

// 加载状态管理
const isLoading = ref(false);
const loadingProgress = ref(0);
const loadError = ref<string | null>(null);
const currentModelUrl = ref<string | null>(null);

// 背景图片相关
let backgroundTexture: THREE.Texture | null = null;
let backgroundMesh: THREE.Mesh | null = null;
let backgroundImageUrl: string | null = null;
let backgroundDistance = -3; // 背景距离，数值越小越近
let backgroundOffset = { x: 0, y: 0 }; // 背景位置偏移
let backgroundScale = 1.0; // 背景缩放

// 初始化场景
function initScene() {
  if (!container.value) return;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // 创建背景平面
  createBackgroundPlane();

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

  // 如果有传入的 modelUrl，则加载；否则不加载任何模型
  if (props.modelUrl) {
    loadModel(props.modelUrl);
  }

  // 开始动画循环
  function animate() {
    const delta = clock.getDelta();
    if (mixer) {
      mixer.update(delta);
    }
    if (controls) {
      controls.update();
    }
    renderer.render(scene, camera);
    animationLoop = requestAnimationFrame(animate);
  }
  animate();
}

// 加载模型
async function loadModel(url: string) {
  if (!scene) {
    console.error('❌ Scene not initialized');
    return;
  }

  // 重置状态
  isLoading.value = true;
  loadingProgress.value = 0;
  loadError.value = null;
  currentModelUrl.value = url;

  console.log('📦 Loading model from:', url);

  try {
    const loader = new GLTFLoader();

    // 创建加载管理器来跟踪进度
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      loadingProgress.value = progress;
      console.log(`📊 Loading progress: ${progress.toFixed(1)}%`);
    };

    loadingManager.onLoad = () => {
      console.log('✅ All resources loaded');
      loadingProgress.value = 100;
    };

    loadingManager.onError = url => {
      console.error('❌ Error loading resource:', url);
      loadError.value = `Failed to load resource: ${url}`;
    };

    // 将加载管理器分配给 GLTFLoader
    loader.manager = loadingManager;

    const gltf = await loader.loadAsync(url);
    console.log('✅ Model loaded successfully:', gltf);

    // 清除旧模型和动画
    if (model) {
      scene.remove(model);
    }
    if (mixer) {
      mixer.stopAllAction();
      mixer.uncacheRoot(model!);
    }

    model = gltf.scene;
    if (model) {
      scene.add(model);
      console.log('✅ Model added to scene');

      // 检查表情系统
      let morphTargetCount = 0;
      model.traverse(object => {
        if (object instanceof THREE.Mesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            morphTargetCount++;
            console.log('🎭 Found mesh with morph targets:', mesh.name);
            console.log('   Available morph targets:', Object.keys(mesh.morphTargetDictionary));
          }
        }
      });
      console.log(`📊 Total meshes with morph targets: ${morphTargetCount}`);

      // 存储可用的动画
      availableAnimations = gltf.animations;
      console.log(
        '🎬 Available animations:',
        availableAnimations.map(a => a.name)
      );

      // 设置动画混合器
      if (availableAnimations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        console.log('✅ Animation mixer created');

        // 默认播放 Idle 动画
        const idleAnim = availableAnimations.find(a => a.name === 'Idle');
        if (idleAnim) {
          currentAnimationAction = mixer.clipAction(idleAnim);
          currentAnimationAction.setLoop(THREE.LoopRepeat, Infinity);
          currentAnimationAction.play();
          console.log('✅ Playing default Idle animation');
        } else {
          console.warn(
            '⚠️ Idle animation not found, available animations:',
            availableAnimations.map(a => a.name)
          );
        }
      } else {
        console.warn('⚠️ No animations found in model');
      }

      // 调整相机位置
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      console.log('📐 Model dimensions:', {
        center: center.toArray(),
        size: size.toArray(),
      });

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

      camera.position.set(0, size.y * 0.5, cameraZ * 1.5);
      camera.lookAt(center);

      controls.target.copy(center);
      controls.update();

      console.log('📷 Camera adjusted:', {
        position: camera.position.toArray(),
        target: controls.target.toArray(),
      });

      // 加载完成，隐藏加载界面
      setTimeout(() => {
        isLoading.value = false;
        loadingProgress.value = 0;
      }, 500); // 延迟 500ms 让用户看到 100% 进度
    }
  } catch (error) {
    console.error('❌ Error loading model:', error);
    loadError.value = error instanceof Error ? error.message : 'Unknown error occurred';
    isLoading.value = false;
  }
}

// 重试加载
function retryLoad() {
  if (currentModelUrl.value) {
    loadError.value = null;
    loadModel(currentModelUrl.value);
  }
}

// 播放动画
function playAnimation(animationName: string, duration?: number, loop: boolean = true) {
  console.log(
    '🎭 ModelViewer.playAnimation called with:',
    animationName,
    'duration:',
    duration,
    'loop:',
    loop
  );

  if (!mixer || !model) {
    console.warn('❌ Animation mixer or model not initialized');
    console.log('Mixer:', mixer);
    console.log('Model:', model);
    return;
  }

  console.log('Playing animation:', animationName);
  console.log(
    'Available animations:',
    availableAnimations.map(a => a.name)
  );

  try {
    // 查找匹配的动画
    const targetAnim = availableAnimations.find(a => a.name === animationName);
    if (!targetAnim) {
      console.warn(`❌ Animation "${animationName}" not found in available animations`);
      console.log(
        'Available animations:',
        availableAnimations.map(a => a.name)
      );
      return;
    }

    // 创建新的动画动作
    const newAction = mixer.clipAction(targetAnim);

    // 根据参数设置循环模式
    if (loop) {
      newAction.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      newAction.setLoop(THREE.LoopOnce, 1);
      newAction.clampWhenFinished = true;
    }

    // 如果有当前正在播放的动画，创建平滑过渡
    if (currentAnimationAction && currentAnimationAction.isRunning()) {
      console.log(
        `🔄 Cross-fading from ${currentAnimationAction.getClip().name} to ${animationName}`
      );
      newAction.reset();
      newAction.play();
      newAction.crossFadeFrom(currentAnimationAction, 0.5, true);
    } else {
      console.log(`▶️ Starting animation: ${animationName}`);
      newAction.reset().play();
    }

    // 更新当前动画动作
    currentAnimationAction = newAction;
    console.log(`✅ Animation "${animationName}" started successfully`);

    // 如果是非循环动画且有 duration，设置定时器回到 idle
    if (!loop && duration && duration > 0) {
      setTimeout(() => {
        console.log(`⏰ Animation "${animationName}" duration completed, returning to idle`);
        playAnimation('Idle', undefined, true);
      }, duration * 1000);
    }
  } catch (error) {
    console.error('❌ Error playing animation:', error);
  }
}

// 更新表情
function updateEmotion(emotion: string) {
  if (!model) {
    console.warn('Model not loaded');
    return;
  }

  console.log('Updating emotion to:', emotion);

  try {
    model.traverse(object => {
      if (object instanceof THREE.Mesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          console.log('Found mesh with morph targets:', mesh.name);
          console.log('Available morph targets:', Object.keys(mesh.morphTargetDictionary));
          const morphTargetIndex = mesh.morphTargetDictionary[emotion];
          if (morphTargetIndex !== undefined) {
            // 重置所有表情权重
            mesh.morphTargetInfluences.fill(0);
            // 设置目标表情权重
            mesh.morphTargetInfluences[morphTargetIndex] = 1;
            console.log(`Updated emotion "${emotion}" for mesh "${mesh.name}"`);
          } else {
            console.warn(`Emotion "${emotion}" not found in morph targets for mesh "${mesh.name}"`);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating emotion:', error);
  }
}

// 更新音素
function updateViseme(id: number) {
  if (!model) return;
  model.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mesh = obj as THREE.Mesh;
    const dict = mesh.morphTargetDictionary;
    const infl = mesh.morphTargetInfluences;
    if (!dict || !infl) return;

    // Azure visemeId 0-21，假设形变名为 viseme_0, viseme_1…
    const key = `viseme_${id}`;
    const idx = dict[key];
    if (idx === undefined) return;

    // 清零上一个
    if (lastVisemeIndex !== null && infl[lastVisemeIndex] !== undefined) {
      infl[lastVisemeIndex] = 0;
    }

    // 设置当前口型
    infl[idx] = 1;
    lastVisemeIndex = idx;
  });
}

// 创建背景平面
function createBackgroundPlane() {
  // 根据 canvas 尺寸创建合适大小的背景平面
  const canvasWidth = container.value?.clientWidth || 800;
  const canvasHeight = container.value?.clientHeight || 400;

  // 计算合适的背景平面尺寸，使其覆盖整个视野
  const aspectRatio = canvasWidth / canvasHeight;
  let planeWidth, planeHeight;

  if (aspectRatio > 1) {
    // 宽屏：宽度更大
    planeWidth = 20;
    planeHeight = 20 / aspectRatio;
  } else {
    // 高屏：高度更大
    planeWidth = 20 * aspectRatio;
    planeHeight = 20;
  }

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  const material = new THREE.MeshBasicMaterial({
    color: 0xf0f0f0,
    transparent: true,
    opacity: 1,
  });

  backgroundMesh = new THREE.Mesh(geometry, material);
  backgroundMesh.position.z = backgroundDistance; // 使用可调节的背景距离
  backgroundMesh.renderOrder = -1; // 确保在最底层渲染

  if (scene && backgroundMesh) {
    scene.add(backgroundMesh);
  }

  console.log('📐 Background plane created with dimensions:', {
    width: planeWidth,
    height: planeHeight,
    canvasWidth,
    canvasHeight,
    aspectRatio,
  });
}

// 设置背景图片
function setBackgroundImage(imageUrl: string) {
  if (!backgroundMesh) return;

  // 清理之前的纹理
  if (backgroundTexture) {
    backgroundTexture.dispose();
  }

  // 创建新的纹理
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    imageUrl,
    texture => {
      backgroundTexture = texture;

      // 调整纹理参数
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      // 更新材质
      if (backgroundMesh && backgroundMesh.material instanceof THREE.MeshBasicMaterial) {
        backgroundMesh.material.map = texture;
        backgroundMesh.material.needsUpdate = true;
      }

      // 调整背景平面大小以适应图片比例和 canvas 尺寸
      if (texture.image && backgroundMesh) {
        const imageAspectRatio = texture.image.width / texture.image.height;
        const canvasWidth = container.value?.clientWidth || 800;
        const canvasHeight = container.value?.clientHeight || 400;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        let scaleX, scaleY;

        // 根据图片和 canvas 的比例计算最佳缩放
        if (imageAspectRatio > canvasAspectRatio) {
          // 图片更宽，以高度为准
          scaleY = 1;
          scaleX = imageAspectRatio / canvasAspectRatio;
        } else {
          // 图片更高，以宽度为准
          scaleX = 1;
          scaleY = canvasAspectRatio / imageAspectRatio;
        }

        // 应用基础缩放，确保背景覆盖整个视野
        const baseScaleX = scaleX;
        const baseScaleY = scaleY;

        // 应用用户设置的缩放和偏移
        backgroundMesh.scale.set(baseScaleX * backgroundScale, baseScaleY * backgroundScale, 1);
        backgroundMesh.position.set(backgroundOffset.x, backgroundOffset.y, backgroundDistance);

        console.log('🖼️ Background image set with user settings:', {
          imageSize: `${texture.image.width}x${texture.image.height}`,
          imageAspectRatio:
            typeof imageAspectRatio === 'number' && !isNaN(imageAspectRatio)
              ? imageAspectRatio.toFixed(2)
              : '0.00',
          canvasSize: `${canvasWidth}x${canvasHeight}`,
          canvasAspectRatio:
            typeof canvasAspectRatio === 'number' && !isNaN(canvasAspectRatio)
              ? canvasAspectRatio.toFixed(2)
              : '0.00',
          baseScale: {
            x:
              typeof baseScaleX === 'number' && !isNaN(baseScaleX) ? baseScaleX.toFixed(2) : '0.00',
            y:
              typeof baseScaleY === 'number' && !isNaN(baseScaleY) ? baseScaleY.toFixed(2) : '0.00',
          },
          userScale:
            typeof backgroundScale === 'number' && !isNaN(backgroundScale)
              ? backgroundScale.toFixed(2)
              : '0.00',
          userOffset: backgroundOffset,
          userDistance: backgroundDistance,
        });
      }

      backgroundImageUrl = imageUrl;
      console.log('✅ Background image set successfully');
    },
    undefined,
    error => {
      console.error('❌ Error loading background image:', error);
    }
  );
}

// 清除背景图片
function clearBackgroundImage() {
  if (backgroundMesh && backgroundMesh.material instanceof THREE.MeshBasicMaterial) {
    if (backgroundMesh.material.map) {
      backgroundMesh.material.map.dispose();
      backgroundMesh.material.map = null;
    }
    backgroundMesh.material.needsUpdate = true;
  }

  if (backgroundTexture) {
    backgroundTexture.dispose();
    backgroundTexture = null;
  }

  // 重置背景平面大小和用户设置
  if (backgroundMesh) {
    backgroundMesh.scale.set(20, 20, 1);
    backgroundMesh.position.set(0, 0, -3);
  }

  // 重置用户设置
  backgroundDistance = -3;
  backgroundOffset = { x: 0, y: 0 };
  backgroundScale = 1.0;

  backgroundImageUrl = null;
  console.log('✅ Background image cleared and settings reset');
}

// 调节背景距离
function adjustBackgroundDistance(distance: number) {
  backgroundDistance = distance;
  if (backgroundMesh) {
    backgroundMesh.position.z = backgroundDistance;
    console.log('📏 Background distance adjusted to:', backgroundDistance);
  }
}

// 调节背景位置偏移
function adjustBackgroundOffset(offset: { x: number; y: number }) {
  backgroundOffset = offset;
  if (backgroundMesh) {
    backgroundMesh.position.x = backgroundOffset.x;
    backgroundMesh.position.y = backgroundOffset.y;
    console.log('📍 Background offset adjusted to:', backgroundOffset);
  }
}

// 调节背景缩放
function adjustBackgroundScale(scale: number) {
  backgroundScale = scale;
  if (backgroundMesh) {
    backgroundMesh.scale.set(backgroundScale, backgroundScale, 1);
    console.log('🔍 Background scale adjusted to:', backgroundScale);
  }
}

// 重置背景设置
function resetBackgroundSettings() {
  backgroundDistance = -3;
  backgroundOffset = { x: 0, y: 0 };
  backgroundScale = 1.0;

  if (backgroundMesh) {
    backgroundMesh.position.set(backgroundOffset.x, backgroundOffset.y, backgroundDistance);
    backgroundMesh.scale.set(backgroundScale, backgroundScale, 1);
    console.log('🔄 Background settings reset to default');
  }
}

// 处理窗口大小变化
function handleResize() {
  if (!container.value || !camera || !renderer) return;

  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);

  // 重新调整背景平面大小
  if (backgroundMesh && backgroundMesh.geometry) {
    const canvasWidth = container.value.clientWidth;
    const canvasHeight = container.value.clientHeight;
    const aspectRatio = canvasWidth / canvasHeight;

    let planeWidth, planeHeight;
    if (aspectRatio > 1) {
      planeWidth = 20;
      planeHeight = 20 / aspectRatio;
    } else {
      planeWidth = 20 * aspectRatio;
      planeHeight = 20;
    }

    // 更新几何体
    backgroundMesh.geometry.dispose();
    backgroundMesh.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    console.log('📐 Background plane resized:', {
      newSize: `${typeof planeWidth === 'number' && !isNaN(planeWidth) ? planeWidth.toFixed(2) : '0.00'}x${typeof planeHeight === 'number' && !isNaN(planeHeight) ? planeHeight.toFixed(2) : '0.00'}`,
      canvasSize: `${canvasWidth}x${canvasHeight}`,
      aspectRatio:
        typeof aspectRatio === 'number' && !isNaN(aspectRatio) ? aspectRatio.toFixed(2) : '0.00',
    });
  }
}

// 监听属性变化
watch(
  () => props.modelUrl,
  newUrl => {
    if (newUrl) {
      loadModel(newUrl);
    }
  }
);

watch(
  () => props.emotion,
  newEmotion => {
    if (newEmotion) {
      console.log('Emotion prop changed:', newEmotion);
      updateEmotion(newEmotion);
    }
  }
);

watch(
  () => props.action,
  newAction => {
    if (newAction) {
      console.log('Action prop changed:', newAction);
      playAnimation(newAction, undefined, true);
    }
  }
);

// 组件挂载时初始化
onMounted(() => {
  initScene();
  window.addEventListener('resize', handleResize);
});

// 组件卸载时清理
onUnmounted(() => {
  if (animationLoop !== null) {
    cancelAnimationFrame(animationLoop);
  }
  if (mixer) {
    mixer.stopAllAction();
    if (model) {
      mixer.uncacheRoot(model);
    }
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
  window.removeEventListener('resize', handleResize);
});

// 导出组件
defineExpose({
  playAnimation,
  updateEmotion,
  updateViseme,
  setBackgroundImage,
  clearBackgroundImage,
  adjustBackgroundDistance,
  adjustBackgroundOffset,
  adjustBackgroundScale,
  resetBackgroundSettings,
  getVideoStream: () => {
    if (!renderer || !renderer.domElement) {
      return null;
    }
    return renderer.domElement.captureStream(30); // 30fps
  },
});
</script>

<script lang="ts">
export default {
  name: 'ModelViewer',
};
</script>

<style scoped>
.model-viewer {
  width: 100%;
  height: 400px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

/* 加载覆盖层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  max-width: 300px;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 70%;
  height: 70%;
  top: 15%;
  left: 15%;
  border-top-color: #28a745;
  animation-delay: 0.5s;
}

.spinner-ring:nth-child(3) {
  width: 40%;
  height: 40%;
  top: 30%;
  left: 30%;
  border-top-color: #ffc107;
  animation-delay: 1s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
}

.loading-text p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.loading-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 错误覆盖层 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-content {
  text-align: center;
  max-width: 300px;
  padding: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.error-content h3 {
  margin: 0 0 10px 0;
  color: #dc3545;
  font-size: 18px;
}

.error-content p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #0056b3;
}

.retry-btn:active {
  transform: translateY(1px);
}
</style>
