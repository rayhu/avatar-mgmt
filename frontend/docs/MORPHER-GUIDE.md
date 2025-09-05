# 🎭 Morpher表情系统使用指南

## 概述

本指南介绍如何在Three.js中正确渲染和使用morpher表情系统。Morpher（形变目标）是一种在3D建模中常用的技术，用于创建面部表情、口型变化等动画效果。

## 核心概念

### 1. MorphTarget（形变目标）

- **定义**：形变目标是3D网格的变形版本，存储了相对于基础网格的顶点偏移
- **用途**：用于创建面部表情、口型变化、肌肉变形等效果
- **原理**：通过插值计算在基础网格和形变目标之间的过渡

### 2. MorphTargetDictionary

- **作用**：将形变目标名称映射到数组索引
- **结构**：`{ "smile": 0, "frown": 1, "blink": 2 }`

### 3. MorphTargetInfluences

- **作用**：控制每个形变目标的影响权重（0-1）
- **数组**：每个索引对应一个形变目标的影响程度

## 使用方法

### 基础表情切换

```typescript
// 切换到微笑表情
modelViewerRef.updateEmotion('smile', 0.8); // 0.8秒过渡时间

// 切换到皱眉表情
modelViewerRef.updateEmotion('frown', 0.5); // 0.5秒过渡时间
```

### 表情混合

```typescript
// 混合多个表情
modelViewerRef.blendEmotions([
  { emotion: 'smile', weight: 0.7 },
  { emotion: 'blink', weight: 0.3 },
]);
```

### 获取可用表情

```typescript
// 获取所有可用的表情名称
const emotions = modelViewerRef.getAvailableEmotions();
console.log('Available emotions:', emotions);
```

### 获取当前权重

```typescript
// 获取当前所有网格的表情权重
const weights = modelViewerRef.getCurrentEmotionWeights();
console.log('Current weights:', weights);
```

### 重置表情

```typescript
// 重置所有表情权重到0
modelViewerRef.resetAllEmotionWeights();
```

## 技术实现细节

### 1. 平滑过渡系统

```typescript
// 表情过渡使用缓动函数
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 权重插值计算
const currentWeight = startWeight + (endWeight - startWeight) * progress;
```

### 2. 权重管理

- **保存状态**：在切换表情前保存当前权重
- **目标设置**：设置目标表情的权重值
- **插值计算**：在过渡期间计算中间权重值
- **状态清理**：过渡完成后清理临时状态

### 3. 性能优化

- **批量更新**：一次性更新所有相关网格
- **条件渲染**：只在需要时更新表情过渡
- **内存管理**：及时清理不需要的数据结构

## 常见问题解决

### 1. 看不到表情变化

**可能原因**：

- 模型没有morpher数据
- 表情名称不匹配
- 权重设置不正确

**解决方法**：

```typescript
// 检查模型是否包含morpher数据
const emotions = modelViewerRef.getAvailableEmotions();
console.log('Available emotions:', emotions);

// 检查特定网格的morpher信息
model.traverse(object => {
  if (object instanceof THREE.Mesh) {
    const mesh = object as THREE.Mesh;
    if (mesh.morphTargetDictionary) {
      console.log(
        'Mesh:',
        mesh.name,
        'Morph targets:',
        Object.keys(mesh.morphTargetDictionary)
      );
    }
  }
});
```

### 2. 表情变化过于突兀

**解决方法**：

```typescript
// 使用更长的过渡时间
modelViewerRef.updateEmotion('smile', 1.5); // 1.5秒过渡

// 或者使用表情混合
modelViewerRef.blendEmotions([
  { emotion: 'neutral', weight: 0.3 },
  { emotion: 'smile', weight: 0.7 },
]);
```

### 3. 多个表情冲突

**解决方法**：

```typescript
// 先重置所有表情
modelViewerRef.resetAllEmotionWeights();

// 然后应用新的表情组合
modelViewerRef.blendEmotions([
  { emotion: 'smile', weight: 0.8 },
  { emotion: 'blink', weight: 0.2 },
]);
```

## 最佳实践

### 1. 表情命名规范

```typescript
// 推荐的表情命名
const emotionNames = [
  'neutral', // 中性表情
  'happy', // 开心
  'sad', // 悲伤
  'angry', // 愤怒
  'surprised', // 惊讶
  'blink', // 眨眼
  'mouth_open', // 张嘴
  'mouth_close', // 闭嘴
];
```

### 2. 权重值设置

```typescript
// 主要表情：权重1.0
// 次要表情：权重0.3-0.7
// 微调表情：权重0.1-0.3

// 示例：微笑+眨眼
modelViewerRef.blendEmotions([
  { emotion: 'happy', weight: 1.0 }, // 主要表情
  { emotion: 'blink', weight: 0.5 }, // 次要表情
]);
```

### 3. 过渡时间设置

```typescript
// 快速表情变化：0.3-0.5秒
modelViewerRef.updateEmotion('blink', 0.3);

// 中等表情变化：0.5-1.0秒
modelViewerRef.updateEmotion('smile', 0.8);

// 缓慢表情变化：1.0-2.0秒
modelViewerRef.updateEmotion('sad', 1.5);
```

## 调试技巧

### 1. 控制台日志

```typescript
// 启用详细日志
console.log('🎭 Emotion system initialized');
console.log('📊 Available emotions:', availableEmotions);
console.log('🔄 Transition progress:', progress);
```

### 2. 权重可视化

使用`EmotionTester`组件实时查看：

- 可用表情列表
- 当前表情权重
- 权重变化过程

### 3. 性能监控

```typescript
// 监控表情更新性能
const startTime = performance.now();
modelViewerRef.updateEmotion('smile');
const endTime = performance.now();
console.log(`Emotion update took ${endTime - startTime}ms`);
```

## 扩展功能

### 1. 表情序列

```typescript
// 创建表情动画序列
async function playEmotionSequence() {
  const sequence = [
    { emotion: 'neutral', duration: 1000 },
    { emotion: 'happy', duration: 2000 },
    { emotion: 'surprised', duration: 1000 },
    { emotion: 'neutral', duration: 1000 },
  ];

  for (const step of sequence) {
    modelViewerRef.updateEmotion(step.emotion, step.duration / 1000);
    await new Promise(resolve => setTimeout(resolve, step.duration));
  }
}
```

### 2. 表情响应

```typescript
// 根据用户输入响应表情
function handleUserInput(input: string) {
  if (input.includes('happy') || input.includes('😊')) {
    modelViewerRef.updateEmotion('happy', 0.5);
  } else if (input.includes('sad') || input.includes('😢')) {
    modelViewerRef.updateEmotion('sad', 0.5);
  }
}
```

### 3. 表情随机化

```typescript
// 随机表情变化
function randomEmotionChange() {
  const emotions = modelViewerRef.getAvailableEmotions();
  const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  const randomDuration = 0.5 + Math.random() * 1.5; // 0.5-2.0秒

  modelViewerRef.updateEmotion(randomEmotion, randomDuration);
}
```

## 总结

通过正确使用morpher表情系统，你可以：

1. **创建生动的面部表情**：让3D角色具有丰富的表情变化
2. **实现平滑的表情过渡**：避免突兀的表情切换
3. **支持复杂的表情混合**：组合多个表情创建新的效果
4. **优化性能表现**：高效管理表情更新和渲染

记住，好的表情系统不仅需要正确的技术实现，还需要合理的艺术设计。确保你的morpher数据具有足够的细节和自然的过渡效果。
