# 动态动画配置系统

## 概述

动态动画配置系统允许为不同的3D模型定义不同的可用动画和表情，解决了之前硬编码动画列表无法适配多种GLB模型的问题。通过JSON配置文件，可以为每个模型定制专属的动作和表情列表，实现真正的动态按钮/菜单生成。

## 系统架构

### 核心文件

1. **配置文件**: `frontend/src/config/model-animations.json`
   - 定义所有模型的动画配置
   - 包含模型特定的动作和表情定义
   - 提供默认回退配置

2. **组合式函数**: `frontend/src/composables/useModelAnimations.ts`
   - 动态加载模型配置
   - 提供响应式的动画数据
   - 管理模型切换时的配置更新

3. **使用组件**:
   - `frontend/src/views/TestViewer.vue` - 测试界面
   - `frontend/src/views/Animate.vue` - 主要动画界面

## 配置文件结构

### JSON配置格式

```json
{
  "models": {
    "袋袋基础版": {
      "id": 1,
      "name": "袋袋基础版",
      "defaultConfig": true,
      "animations": {
        "actions": [
          {
            "actualName": "Idle",
            "callName": "idle",
            "displayName": "animate.actions.idle",
            "description": "待机动画，角色保持静止状态",
            "category": "basic",
            "enabled": true,
            "parameters": {
              "loop": true,
              "duration": 2.0,
              "speed": 1.0
            }
          }
        ],
        "emotions": [
          {
            "actualName": "Angry",
            "callName": "angry",
            "displayName": "animate.emotions.angry",
            "description": "生气表情，角色表现出愤怒",
            "intensity": 1.0,
            "enabled": true,
            "morphTargets": ["angry"]
          }
        ]
      }
    }
  }
}
```

### 字段说明

#### 模型级别配置

- `id`: 模型唯一标识符
- `name`: 模型显示名称
- `defaultConfig`: 是否为默认配置（可选）
- `animations`: 包含动作和表情的动画定义

#### 动画配置字段

- `actualName`: GLB文件中的实际动画名称
- `callName`: 系统内部调用名称
- `displayName`: UI显示的多语言键值
- `description`: 动画描述
- `category`: 动画分类（basic, movement, gesture等）
- `enabled`: 是否启用此动画
- `parameters`: 动画参数
  - `loop`: 是否循环播放
  - `duration`: 持续时间（秒）
  - `speed`: 播放速度倍数

#### 表情特有字段

- `intensity`: 表情强度（0-1）
- `morphTargets`: 对应的形变目标数组

## 使用方法

### 1. 在组件中使用

```typescript
import { useModelAnimations } from '@/composables/useModelAnimations';

// 在组件中
const modelAnimations = useModelAnimations(selectedModel);
const { availableActions, availableEmotions, updateAnimationsForCurrentModel } =
  modelAnimations;

// 动态获取可用动画
const animations = computed(() =>
  availableActions.value.map(anim => anim.callName)
);

// 监听模型变化
watch(
  selectedModel,
  newModel => {
    if (newModel) {
      updateAnimationsForCurrentModel();
    }
  },
  { immediate: true }
);
```

### 2. 获取动画配置信息

```typescript
// 根据调用名称获取完整配置
const animationConfig = getAnimationByCallName('idle');

// 获取显示名称（用于UI）
const displayName = getAnimationDisplayName('idle');

// 获取动画描述
const description = getAnimationDescription('idle');

// 获取动画参数
const parameters = getAnimationParameters('idle');
```

### 3. 添加新模型配置

要为新模型添加动画配置，请按以下步骤：

1. 在`model-animations.json`中添加新的模型条目
2. 定义该模型的actions和emotions数组
3. 为每个动画指定正确的actualName（必须与GLB文件中的动画名称匹配）

```json
{
  "models": {
    "新模型名称": {
      "id": 3,
      "name": "新模型名称",
      "animations": {
        "actions": [
          {
            "actualName": "Walk",
            "callName": "walk",
            "displayName": "animate.actions.walk",
            "category": "movement",
            "enabled": true,
            "parameters": {
              "loop": true,
              "duration": 2.0
            }
          }
        ],
        "emotions": []
      }
    }
  }
}
```

## API参考

### useModelAnimations

组合式函数，提供动态动画配置管理。

#### 参数

- `selectedModel: Ref<Avatar | null>` - 当前选中的模型

#### 返回值

- `currentAnimations: Ref<ModelAnimationConfig | null>` - 当前模型的动画配置
- `availableActions: ComputedRef<AnimationConfig[]>` - 可用的动作动画
- `availableEmotions: ComputedRef<AnimationConfig[]>` - 可用的表情动画
- `updateAnimationsForCurrentModel(): void` - 更新当前模型的动画配置
- `getAnimationByCallName(callName: string): AnimationConfig | null` - 根据调用名获取动画配置
- `getAnimationDisplayName(callName: string): string` - 获取动画显示名称
- `isAnimationAvailable(callName: string): boolean` - 检查动画是否可用

## 最佳实践

### 1. 命名规范

- **actualName**: 使用GLB文件中的确切动画名称
- **callName**: 使用小写字母和驼峰命名法
- **displayName**: 使用i18n键值，遵循`animate.actions.xxx`或`animate.emotions.xxx`格式

### 2. 分类管理

将动画按功能分类：

- `basic`: 基础动画（Idle, Default等）
- `movement`: 移动动画（Walk, Run, Jump等）
- `gesture`: 手势动画（Wave, ThumbsUp, Yes, No等）
- `combat`: 战斗动画（Punch, Kick等）
- `entertainment`: 娱乐动画（Dance等）

### 3. 参数配置

- 循环动画设置`loop: true`
- 一次性动画设置`loop: false`并指定合适的`duration`
- 根据动画实际情况调整`speed`参数

### 4. 回退机制

始终保持`default`配置作为回退：

- 包含最基础的Idle动画
- 包含基本的表情配置
- 确保所有模型都能正常工作

## 故障排除

### 常见问题

1. **动画不播放**
   - 检查`actualName`是否与GLB文件中的动画名称完全匹配
   - 确认`enabled`字段为`true`
   - 查看浏览器控制台中的错误信息

2. **表情不显示**
   - 检查GLB模型是否包含对应的morphTarget
   - 确认`morphTargets`数组中的名称正确
   - 验证模型的形变目标字典

3. **模型切换后动画列表没有更新**
   - 确保调用了`updateAnimationsForCurrentModel()`
   - 检查模型名称是否与配置文件中的键名匹配
   - 查看是否有监听器正确设置

### 调试技巧

1. **启用调试日志**

   ```typescript
   // 在组件中添加
   watch(availableActions, actions => {
     console.log('🎭 Available actions:', actions);
   });
   ```

2. **检查配置加载**

   ```typescript
   const allConfigs = getAllModelConfigs();
   console.log('All model configs:', allConfigs);
   ```

3. **验证模型匹配**
   ```typescript
   const config = getAnimationsForModel(selectedModel.value?.name);
   console.log('Model config:', config);
   ```

## 升级指南

### 从静态配置迁移

如果你之前使用的是静态的动画配置（如`animations.ts`），请按以下步骤迁移：

1. **移除旧的导入**

   ```typescript
   // 移除这些导入
   import {
     getActionAnimations,
     getEmotionAnimations,
   } from '@/config/animations';
   ```

2. **使用新的组合式函数**

   ```typescript
   // 替换为
   import { useModelAnimations } from '@/composables/useModelAnimations';
   ```

3. **更新组件逻辑**

   ```typescript
   // 旧方式
   const actions = getActionAnimations().map(a => a.callName);

   // 新方式
   const modelAnimations = useModelAnimations(selectedModel);
   const { availableActions } = modelAnimations;
   const actions = computed(() => availableActions.value.map(a => a.callName));
   ```

## 未来扩展

### 计划功能

1. **GLB自动解析**
   - 自动从GLB文件中提取动画名称
   - 自动识别morphTarget名称
   - 生成基础配置文件

2. **可视化配置编辑器**
   - Web界面编辑配置
   - 实时预览动画效果
   - 批量导入/导出配置

3. **高级动画控制**
   - 动画混合和过渡
   - 条件动画播放
   - 动画事件回调

### 扩展示例

如需扩展系统功能，可以在`useModelAnimations.ts`中添加新的方法：

```typescript
// 添加动画到模型
function addAnimationToModel(
  modelName: string,
  type: 'actions' | 'emotions',
  animation: AnimationConfig
): boolean {
  // 实现代码...
}

// 移除动画
function removeAnimationFromModel(
  modelName: string,
  type: 'actions' | 'emotions',
  callName: string
): boolean {
  // 实现代码...
}
```

---

## 总结

动态动画配置系统提供了灵活、可扩展的方式来管理3D模型的动画和表情。通过JSON配置文件，可以轻松地为不同模型定制专属的动画集合，同时保持代码的整洁和可维护性。

如有问题或需要进一步的功能扩展，请参考本文档或查看相关源码实现。
