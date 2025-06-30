# 动画系统解耦设计文档

## 🎯 概述

本动画系统实现了显示名称、调用名称和实际名称的解耦，提供了更好的可维护性、扩展性和国际化支持。

## 🏗️ 架构设计

### 三层解耦结构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   显示名称       │    │   调用名称       │    │   实际名称       │
│  Display Name   │    │   Call Name     │    │  Actual Name    │
│                 │    │                 │    │                 │
│ • 国际化支持     │    │ • 代码标识符     │    │ • Three.js 调用  │
│ • 用户友好      │    │ • 类型安全       │    │ • 动画文件名称   │
│ • 可读性强      │    │ • 统一命名       │    │ • 技术实现       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心概念

1. **显示名称 (Display Name)**: 用于 UI 显示，支持国际化
2. **调用名称 (Call Name)**: 用于代码中的标识符，统一命名规范
3. **实际名称 (Actual Name)**: 用于 Three.js 动画系统调用

## 📁 文件结构

```
frontend/src/
├── types/
│   └── animation.ts          # 动画类型定义
├── config/
│   └── animations.ts         # 动画配置文件
├── utils/
│   └── animationManager.ts   # 动画管理器
├── components/
│   └── AnimationSelector.vue # 动画选择器组件
└── locales/
    ├── zh-CN.ts             # 中文翻译
    └── en.ts                # 英文翻译
```

## 🔧 使用方法

### 1. 基本使用

```typescript
import { animationManager } from '@/utils/animationManager';
import { getAnimationByCallName } from '@/config/animations';

// 播放动画
await animationManager.playAnimation('walking');

// 获取动画信息
const animation = getAnimationByCallName('walking');
console.log(animation);
// {
//   actualName: 'Walking',
//   callName: 'walking',
//   displayName: 'animate.actions.walking',
//   type: 'action',
//   description: '行走动画，角色向前移动'
// }
```

### 2. 在组件中使用

```vue
<template>
  <div>
    <button @click="playWalkAnimation">行走</button>
    <button @click="playRunAnimation">奔跑</button>
  </div>
</template>

<script setup lang="ts">
import { animationManager } from '@/utils/animationManager';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

async function playWalkAnimation() {
  try {
    await animationManager.playAnimation('walking');
  } catch (error) {
    console.error('播放动画失败:', error);
  }
}

async function playRunAnimation() {
  try {
    await animationManager.playAnimation('running');
  } catch (error) {
    console.error('播放动画失败:', error);
  }
}
</script>
```

### 3. 使用动画选择器组件

```vue
<template>
  <AnimationSelector
    @action-selected="handleActionSelected"
    @emotion-selected="handleEmotionSelected"
  />
</template>

<script setup lang="ts">
import AnimationSelector from '@/components/AnimationSelector.vue';

function handleActionSelected(callName: string) {
  console.log('选择的动作:', callName);
}

function handleEmotionSelected(callName: string) {
  console.log('选择的表情:', callName);
}
</script>
```

## 🎨 动画配置

### 动作动画配置

```typescript
{
  actualName: 'Walking',           // Three.js 动画名称
  callName: 'walking',             // 代码中的标识符
  displayName: 'animate.actions.walking', // 国际化键
  type: AnimationType.ACTION,      // 动画类型
  description: '行走动画，角色向前移动', // 描述
  category: 'movement',            // 分类
  enabled: true,                   // 是否启用
  parameters: {                    // 动画参数
    loop: true,                    // 是否循环
    duration: 0,                   // 持续时间（0表示无限）
    speed: 1.0                     // 播放速度
  }
}
```

### 表情动画配置

```typescript
{
  actualName: 'Angry',             // 表情名称
  callName: 'angry',               // 代码标识符
  displayName: 'animate.emotions.angry', // 国际化键
  type: AnimationType.EMOTION,     // 动画类型
  description: '生气表情，角色表现出愤怒', // 描述
  intensity: 1.0,                  // 强度
  enabled: true,                   // 是否启用
  morphTargets: ['angry', 'brow_furrow'] // 变形目标
}
```

## 🌐 国际化支持

### 中文翻译 (zh-CN.ts)

```typescript
{
  animate: {
    actions: {
      idle: '待机',
      walking: '行走',
      running: '奔跑',
      // ...
    },
    emotions: {
      neutral: '平静',
      angry: '生气',
      surprised: '惊讶',
      sad: '悲伤'
    }
  },
  viseme: {
    silence: '静音',
    aa: '元音 aa',
    // ...
  }
}
```

### 英文翻译 (en.ts)

```typescript
{
  animate: {
    actions: {
      idle: 'Idle',
      walking: 'Walking',
      running: 'Running',
      // ...
    },
    emotions: {
      neutral: 'Neutral',
      angry: 'Angry',
      surprised: 'Surprised',
      sad: 'Sad'
    }
  },
  viseme: {
    silence: 'Silence',
    aa: 'Vowel aa',
    // ...
  }
}
```

## 🔄 迁移指南

### 从旧系统迁移

#### 旧代码
```typescript
// 旧的方式
const actions = ['Idle', 'Walking', 'Running'];
const emotions = ['Angry', 'Surprised', 'Sad'];

function playAnimation(name: string) {
  modelViewer.playAnimation(name);
}
```

#### 新代码
```typescript
// 新的方式
import { animationManager } from '@/utils/animationManager';

async function playAnimation(callName: string) {
  await animationManager.playAnimation(callName);
}

// 使用调用名称
await playAnimation('walking');  // 而不是 'Walking'
```

### 更新现有组件

#### 1. 更新 Animate.vue

```typescript
// 替换硬编码的动画数组
const actions = [
  'Idle', 'Walking', 'Running', 'Jump', 'Wave', 'Dance',
  'Death', 'No', 'Punch', 'Sitting', 'Standing', 'ThumbsUp',
  'WalkJump', 'Yes'
] as const;

// 使用动画配置
import { getActionAnimations } from '@/config/animations';
const actions = getActionAnimations().map(anim => anim.callName);
```

#### 2. 更新 TestViewer.vue

```typescript
// 替换硬编码的动画数组
const animations: string[] = [
  'Idle', 'Walking', 'Running', 'Jump', 'Wave', 'Dance',
  'Death', 'No', 'Punch', 'Sitting', 'Standing', 'ThumbsUp',
  'WalkJump', 'Yes'
];

// 使用动画配置
import { getActionAnimations } from '@/config/animations';
const animations = getActionAnimations().map(anim => anim.callName);
```

## 🚀 扩展功能

### 添加新动画

1. **更新配置文件** (`config/animations.ts`)

```typescript
{
  actualName: 'NewAnimation',
  callName: 'newAnimation',
  displayName: 'animate.actions.newAnimation',
  type: AnimationType.ACTION,
  description: '新动画描述',
  category: 'custom',
  enabled: true,
  parameters: {
    loop: false,
    duration: 2.0,
    speed: 1.0
  }
}
```

2. **添加翻译** (`locales/zh-CN.ts`)

```typescript
{
  animate: {
    actions: {
      newAnimation: '新动画'
    }
  }
}
```

3. **添加英文翻译** (`locales/en.ts`)

```typescript
{
  animate: {
    actions: {
      newAnimation: 'New Animation'
    }
  }
}
```

### 添加新动画类型

1. **更新类型定义** (`types/animation.ts`)

```typescript
export enum AnimationType {
  ACTION = 'action',
  EMOTION = 'emotion',
  VISEME = 'viseme',
  CUSTOM = 'custom'  // 新增类型
}

export interface CustomAnimation {
  actualName: string;
  callName: string;
  displayName: string;
  type: AnimationType.CUSTOM;
  description?: string;
  customProperty?: string;
}
```

2. **更新动画管理器** (`utils/animationManager.ts`)

```typescript
case AnimationType.CUSTOM:
  await this.playCustomAnimation(animation);
  break;
```

## 📊 优势对比

### 解耦前的问题

- ❌ 硬编码耦合：显示名称、调用名称、实际名称混在一起
- ❌ 国际化困难：需要手动处理大小写转换和翻译映射
- ❌ 维护复杂：修改一个名称需要同时修改多个地方
- ❌ 扩展性差：添加新的动画需要修改多个文件

### 解耦后的优势

- ✅ 清晰分离：显示名称、调用名称、实际名称各司其职
- ✅ 易于维护：修改显示名称不影响调用逻辑
- ✅ 国际化友好：显示名称可以完全独立于技术实现
- ✅ 扩展性强：可以轻松添加新的动画类型
- ✅ 类型安全：TypeScript 提供完整的类型检查
- ✅ 统一管理：动画管理器提供统一的接口

## 🔍 调试和测试

### 查看动画信息

```typescript
// 获取动画信息
const info = animationManager.getAnimationInfo('walking');
console.log(info);

// 检查动画是否可用
const enabled = animationManager.isAnimationEnabled('walking');
console.log('动画是否可用:', enabled);
```

### 监听动画事件

```typescript
// 监听动画开始事件
animationManager.on('start', (event) => {
  console.log('动画开始:', event.animation.displayName);
});

// 监听动画结束事件
animationManager.on('end', (event) => {
  console.log('动画结束');
});

// 监听动画错误事件
animationManager.on('error', (event) => {
  console.error('动画错误:', event.data);
});
```

### 测试动画序列

```typescript
// 播放动画序列
await animationManager.playAnimationSequence([
  'idle',
  'walking',
  'running',
  'idle'
]);
```

## 📝 最佳实践

1. **命名规范**
   - 调用名称使用 camelCase
   - 实际名称使用 PascalCase
   - 显示名称使用国际化键

2. **错误处理**
   - 始终使用 try-catch 包装动画播放
   - 检查动画是否存在和可用
   - 提供用户友好的错误信息

3. **性能优化**
   - 缓存动画配置
   - 避免频繁创建动画对象
   - 使用事件监听而不是轮询

4. **类型安全**
   - 使用 TypeScript 类型定义
   - 避免使用 any 类型
   - 利用类型检查捕获错误

## 🎯 总结

通过实现显示名称、调用名称和实际名称的解耦，我们创建了一个更加灵活、可维护和可扩展的动画系统。这个设计不仅解决了当前的问题，还为未来的功能扩展奠定了坚实的基础。 
