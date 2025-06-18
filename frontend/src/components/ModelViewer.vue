<template>
  <div ref="container" class="model-viewer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
let controls: OrbitControls;
let mixer: THREE.AnimationMixer | null = null;
let model: THREE.Group | null = null;
let clock = new THREE.Clock();
let availableAnimations: THREE.AnimationClip[] = [];
let animationLoop: number | null = null;
let currentAnimationAction: THREE.AnimationAction | null = null;
let lastVisemeIndex: number | null = null;

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
    1000,
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
    console.error('Scene not initialized');
    return;
  }

  console.log('Loading model from:', url);
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync(url);
    console.log('Model loaded successfully:', gltf);

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
      console.log('Model added to scene');

      // 检查表情系统
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            console.log('Found mesh with morph targets:', mesh.name);
            console.log('Available morph targets:', Object.keys(mesh.morphTargetDictionary));
          }
        }
      });

      // 存储可用的动画
      availableAnimations = gltf.animations;
      console.log(
        'Available animations:',
        availableAnimations.map((a) => a.name),
      );

      // 设置动画混合器
      if (availableAnimations.length > 0) {
        mixer = new THREE.AnimationMixer(model);

        // 默认播放 Idle 动画
        const idleAnim = availableAnimations.find((a) => a.name === 'Idle');
        if (idleAnim) {
          currentAnimationAction = mixer.clipAction(idleAnim);
          currentAnimationAction.setLoop(THREE.LoopRepeat, Infinity);
          currentAnimationAction.play();
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
        size: size.toArray(),
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
        target: controls.target.toArray(),
      });
    }
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

// 播放动画
function playAnimation(animationName: string) {
  if (!mixer || !model) {
    console.warn('Animation mixer or model not initialized');
    return;
  }

  console.log('Playing animation:', animationName);
  console.log(
    'Available animations:',
    availableAnimations.map((a) => a.name),
  );

  try {
    // 查找匹配的动画
    const targetAnim = availableAnimations.find((a) => a.name === animationName);
    if (!targetAnim) {
      console.warn(`Animation "${animationName}" not found in available animations`);
      return;
    }

    // 创建新的动画动作
    const newAction = mixer.clipAction(targetAnim);
    newAction.setLoop(THREE.LoopRepeat, Infinity);
    newAction.clampWhenFinished = false;

    // 如果有当前正在播放的动画，创建平滑过渡
    if (currentAnimationAction && currentAnimationAction.isRunning()) {
      newAction.reset();
      newAction.play();
      newAction.crossFadeFrom(currentAnimationAction, 0.5, true);
    } else {
      newAction.reset().play();
    }

    // 更新当前动画动作
    currentAnimationAction = newAction;
    console.log(`Animation "${animationName}" started`);
  } catch (error) {
    console.error('Error playing animation:', error);
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
    model.traverse((object) => {
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
  model.traverse((obj) => {
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

// 处理窗口大小变化
function handleResize() {
  if (!container.value || !camera || !renderer) return;

  camera.aspect = container.value.clientWidth / container.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

// 监听属性变化
watch(
  () => props.modelUrl,
  (newUrl) => {
    if (newUrl) {
      loadModel(newUrl);
    }
  },
);

watch(
  () => props.emotion,
  (newEmotion) => {
    if (newEmotion) {
      console.log('Emotion prop changed:', newEmotion);
      updateEmotion(newEmotion);
    }
  },
);

watch(
  () => props.action,
  (newAction) => {
    if (newAction) {
      console.log('Action prop changed:', newAction);
      playAnimation(newAction);
    }
  },
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
}
</style>
