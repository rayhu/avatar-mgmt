/**
 * 动画系统类型定义
 * 实现显示名称、调用名称和实际名称的解耦
 */

// 动画类型枚举
export enum AnimationType {
  ACTION = 'action',
  EMOTION = 'emotion',
  VISEME = 'viseme',
}

// 动作动画定义
export interface ActionAnimation {
  // 实际名称：用于 Three.js 动画系统调用
  actualName: string;
  // 调用名称：用于代码中的标识符
  callName: string;
  // 显示名称：用于 UI 显示，支持国际化
  displayName: string;
  // 动画类型
  type: AnimationType;
  // 动画描述
  description?: string;
  // 动画分类
  category?: string;
  // 是否可用
  enabled?: boolean;
  // 动画参数
  parameters?: {
    loop?: boolean;
    duration?: number;
    speed?: number;
  };
}

// 表情动画定义
export interface EmotionAnimation {
  actualName: string;
  callName: string;
  displayName: string;
  type: AnimationType;
  description?: string;
  intensity?: number;
  enabled?: boolean;
  morphTargets?: string[];
}

// 口型动画定义
export interface VisemeAnimation {
  actualName: string;
  callName: string;
  displayName: string;
  type: AnimationType;
  visemeId: number;
  description?: string;
}

// 联合类型
export type Animation = ActionAnimation | EmotionAnimation | VisemeAnimation;

// 动画配置
export interface AnimationConfig {
  actions: ActionAnimation[];
  emotions: EmotionAnimation[];
  visemes: VisemeAnimation[];
}

// 动画状态
export interface AnimationState {
  currentAction?: string;
  currentEmotion?: string;
  currentViseme?: number;
  isPlaying: boolean;
  progress: number;
}

// 动画事件
export interface AnimationEvent {
  type: 'start' | 'end' | 'progress' | 'error';
  animation: Animation;
  timestamp: number;
  data?: any;
}

// 动画管理器接口
export interface AnimationManager {
  // 获取所有动画
  getAllAnimations(): Animation[];

  // 根据类型获取动画
  getAnimationsByType(type: AnimationType): Animation[];

  // 根据调用名称获取动画
  getAnimationByCallName(callName: string): Animation | undefined;

  // 根据实际名称获取动画
  getAnimationByActualName(actualName: string): Animation | undefined;

  // 播放动画
  playAnimation(callName: string): Promise<void>;

  // 停止动画
  stopAnimation(): void;

  // 获取当前状态
  getCurrentState(): AnimationState;

  // 监听动画事件
  on(event: string, callback: (event: AnimationEvent) => void): void;

  // 移除事件监听
  off(event: string, callback: (event: AnimationEvent) => void): void;
}
