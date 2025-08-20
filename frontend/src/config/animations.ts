/**
 * 动画配置文件
 * 定义显示名称、调用名称和实际名称的映射关系
 */

import { AnimationConfig, AnimationType } from '@/types/animation';

// 动作动画配置
const actionAnimations = [
  {
    actualName: 'Idle',
    callName: 'idle',
    displayName: 'animate.actions.idle',
    type: AnimationType.ACTION,
    description: '待机动画，角色保持静止状态',
    category: 'basic',
    enabled: true,
    parameters: {
      loop: true,
      duration: 2.0,
      speed: 1.0,
    },
  },
  {
    actualName: 'Walking',
    callName: 'walking',
    displayName: 'animate.actions.walking',
    type: AnimationType.ACTION,
    description: '行走动画，角色向前移动',
    category: 'movement',
    enabled: true,
    parameters: {
      loop: true,
      duration: 1.5,
      speed: 1.0,
    },
  },
  {
    actualName: 'Running',
    callName: 'running',
    displayName: 'animate.actions.running',
    type: AnimationType.ACTION,
    description: '奔跑动画，角色快速移动',
    category: 'movement',
    enabled: true,
    parameters: {
      loop: true,
      duration: 1.0,
      speed: 1.2,
    },
  },
  {
    actualName: 'Jump',
    callName: 'jump',
    displayName: 'animate.actions.jump',
    type: AnimationType.ACTION,
    description: '跳跃动画，角色向上跳跃',
    category: 'movement',
    enabled: true,
    parameters: {
      loop: false,
      duration: 1.5,
      speed: 1.0,
    },
  },
  {
    actualName: 'Wave',
    callName: 'wave',
    displayName: 'animate.actions.wave',
    type: AnimationType.ACTION,
    description: '挥手动画，角色挥手打招呼',
    category: 'gesture',
    enabled: true,
    parameters: {
      loop: false,
      duration: 2.0,
      speed: 1.0,
    },
  },
  {
    actualName: 'Dance',
    callName: 'dance',
    displayName: 'animate.actions.dance',
    type: AnimationType.ACTION,
    description: '舞蹈动画，角色跳舞',
    category: 'entertainment',
    enabled: true,
    parameters: {
      loop: true,
      duration: 3.0,
      speed: 1.0,
    },
  },
  // {
  //   actualName: 'Death',
  //   callName: 'death',
  //   displayName: 'animate.actions.death',
  //   type: AnimationType.ACTION,
  //   description: '死亡动画，角色倒下',
  //   category: 'dramatic',
  //   enabled: true,
  //   parameters: {
  //     loop: false,
  //     duration: 3.0,
  //     speed: 1.0
  //   }
  // },
  {
    actualName: 'No',
    callName: 'no',
    displayName: 'animate.actions.no',
    type: AnimationType.ACTION,
    description: '摇头动画，角色摇头表示否定',
    category: 'gesture',
    enabled: true,
    parameters: {
      loop: false,
      duration: 1.5,
      speed: 1.0,
    },
  },
  {
    actualName: 'Punch',
    callName: 'punch',
    displayName: 'animate.actions.punch',
    type: AnimationType.ACTION,
    description: '出拳动画，角色出拳攻击',
    category: 'combat',
    enabled: true,
    parameters: {
      loop: false,
      duration: 2.0,
      speed: 1.0,
    },
  },
  // {
  //   actualName: 'Sitting',
  //   callName: 'sitting',
  //   displayName: 'animate.actions.sitting',
  //   type: AnimationType.ACTION,
  //   description: '坐下动画，角色坐下',
  //   category: 'posture',
  //   enabled: true,
  //   parameters: {
  //     loop: false,
  //     duration: 2.0,
  //     speed: 1.0
  //   }
  // },
  // {
  //   actualName: 'Standing',
  //   callName: 'standing',
  //   displayName: 'animate.actions.standing',
  //   type: AnimationType.ACTION,
  //   description: '站立动画，角色站立',
  //   category: 'posture',
  //   enabled: true,
  //   parameters: {
  //     loop: true,
  //     duration: 0,
  //     speed: 1.0
  //   }
  // },
  {
    actualName: 'ThumbsUp',
    callName: 'thumbsUp',
    displayName: 'animate.actions.thumbsUp',
    type: AnimationType.ACTION,
    description: '点赞动画，角色竖起大拇指',
    category: 'gesture',
    enabled: true,
    parameters: {
      loop: false,
      duration: 2.0,
      speed: 1.0,
    },
  },
  {
    actualName: 'WalkJump',
    callName: 'walkJump',
    displayName: 'animate.actions.walkJump',
    type: AnimationType.ACTION,
    description: '行走跳跃动画，角色边走边跳',
    category: 'movement',
    enabled: true,
    parameters: {
      loop: true,
      duration: 2.0,
      speed: 1.0,
    },
  },
  {
    actualName: 'Yes',
    callName: 'yes',
    displayName: 'animate.actions.yes',
    type: AnimationType.ACTION,
    description: '点头动画，角色点头表示肯定',
    category: 'gesture',
    enabled: true,
    parameters: {
      loop: false,
      duration: 1.5,
      speed: 1.0,
    },
  },
];

// 表情动画配置
const emotionAnimations = [
  {
    actualName: 'Angry',
    callName: 'angry',
    displayName: 'animate.emotions.angry',
    type: AnimationType.EMOTION,
    description: '生气表情，角色表现出愤怒',
    intensity: 1.0,
    enabled: true,
    morphTargets: ['angry'],
  },
  {
    actualName: 'Surprised',
    callName: 'surprised',
    displayName: 'animate.emotions.surprised',
    type: AnimationType.EMOTION,
    description: '惊讶表情，角色表现出惊讶',
    intensity: 1.0,
    enabled: true,
    morphTargets: ['surprised'],
  },
  {
    actualName: 'Sad',
    callName: 'sad',
    displayName: 'animate.emotions.sad',
    type: AnimationType.EMOTION,
    description: '悲伤表情，角色表现出悲伤',
    intensity: 1.0,
    enabled: true,
    morphTargets: ['sad'],
  },
];

// 口型动画配置（Azure TTS Viseme 映射）
const visemeAnimations = [
  {
    actualName: 'viseme_0',
    callName: 'viseme_0',
    displayName: 'viseme.silence',
    type: AnimationType.VISEME,
    visemeId: 0,
    description: '静音',
  },
  {
    actualName: 'viseme_1',
    callName: 'viseme_1',
    displayName: 'viseme.aa',
    type: AnimationType.VISEME,
    visemeId: 1,
    description: '元音 aa',
  },
  {
    actualName: 'viseme_2',
    callName: 'viseme_2',
    displayName: 'viseme.aa',
    type: AnimationType.VISEME,
    visemeId: 2,
    description: '元音 aa',
  },
  {
    actualName: 'viseme_3',
    callName: 'viseme_3',
    displayName: 'viseme.ao',
    type: AnimationType.VISEME,
    visemeId: 3,
    description: '元音 ao',
  },
  {
    actualName: 'viseme_4',
    callName: 'viseme_4',
    displayName: 'viseme.ao',
    type: AnimationType.VISEME,
    visemeId: 4,
    description: '元音 ao',
  },
  {
    actualName: 'viseme_5',
    callName: 'viseme_5',
    displayName: 'viseme.ao',
    type: AnimationType.VISEME,
    visemeId: 5,
    description: '元音 ao',
  },
  {
    actualName: 'viseme_6',
    callName: 'viseme_6',
    displayName: 'viseme.ax',
    type: AnimationType.VISEME,
    visemeId: 6,
    description: '元音 ax',
  },
  {
    actualName: 'viseme_7',
    callName: 'viseme_7',
    displayName: 'viseme.ax',
    type: AnimationType.VISEME,
    visemeId: 7,
    description: '元音 ax',
  },
  {
    actualName: 'viseme_8',
    callName: 'viseme_8',
    displayName: 'viseme.ax',
    type: AnimationType.VISEME,
    visemeId: 8,
    description: '元音 ax',
  },
  {
    actualName: 'viseme_9',
    callName: 'viseme_9',
    displayName: 'viseme.ay',
    type: AnimationType.VISEME,
    visemeId: 9,
    description: '元音 ay',
  },
  {
    actualName: 'viseme_10',
    callName: 'viseme_10',
    displayName: 'viseme.ay',
    type: AnimationType.VISEME,
    visemeId: 10,
    description: '元音 ay',
  },
  {
    actualName: 'viseme_11',
    callName: 'viseme_11',
    displayName: 'viseme.ay',
    type: AnimationType.VISEME,
    visemeId: 11,
    description: '元音 ay',
  },
  {
    actualName: 'viseme_12',
    callName: 'viseme_12',
    displayName: 'viseme.b',
    type: AnimationType.VISEME,
    visemeId: 12,
    description: '辅音 b',
  },
  {
    actualName: 'viseme_13',
    callName: 'viseme_13',
    displayName: 'viseme.ch',
    type: AnimationType.VISEME,
    visemeId: 13,
    description: '辅音 ch',
  },
  {
    actualName: 'viseme_14',
    callName: 'viseme_14',
    displayName: 'viseme.d',
    type: AnimationType.VISEME,
    visemeId: 14,
    description: '辅音 d',
  },
  {
    actualName: 'viseme_15',
    callName: 'viseme_15',
    displayName: 'viseme.dh',
    type: AnimationType.VISEME,
    visemeId: 15,
    description: '辅音 dh',
  },
  {
    actualName: 'viseme_16',
    callName: 'viseme_16',
    displayName: 'viseme.er',
    type: AnimationType.VISEME,
    visemeId: 16,
    description: '元音 er',
  },
  {
    actualName: 'viseme_17',
    callName: 'viseme_17',
    displayName: 'viseme.er',
    type: AnimationType.VISEME,
    visemeId: 17,
    description: '元音 er',
  },
  {
    actualName: 'viseme_18',
    callName: 'viseme_18',
    displayName: 'viseme.er',
    type: AnimationType.VISEME,
    visemeId: 18,
    description: '元音 er',
  },
  {
    actualName: 'viseme_19',
    callName: 'viseme_19',
    displayName: 'viseme.ey',
    type: AnimationType.VISEME,
    visemeId: 19,
    description: '元音 ey',
  },
  {
    actualName: 'viseme_20',
    callName: 'viseme_20',
    displayName: 'viseme.ey',
    type: AnimationType.VISEME,
    visemeId: 20,
    description: '元音 ey',
  },
  {
    actualName: 'viseme_21',
    callName: 'viseme_21',
    displayName: 'viseme.ey',
    type: AnimationType.VISEME,
    visemeId: 21,
    description: '元音 ey',
  },
  {
    actualName: 'viseme_22',
    callName: 'viseme_22',
    displayName: 'viseme.f',
    type: AnimationType.VISEME,
    visemeId: 22,
    description: '辅音 f',
  },
];

// 导出动画配置
export const animationConfig: AnimationConfig = {
  actions: actionAnimations,
  emotions: emotionAnimations,
  visemes: visemeAnimations,
};

// 工具函数：根据调用名称获取动画
export function getAnimationByCallName(callName: string): any {
  const allAnimations = [...actionAnimations, ...emotionAnimations, ...visemeAnimations];
  return allAnimations.find(anim => anim.callName === callName);
}

// 工具函数：根据实际名称获取动画
export function getAnimationByActualName(actualName: string): any {
  const allAnimations = [...actionAnimations, ...emotionAnimations, ...visemeAnimations];
  return allAnimations.find(anim => anim.actualName === actualName);
}

// 工具函数：获取所有动作动画
export function getActionAnimations() {
  return actionAnimations;
}

// 工具函数：获取所有表情动画
export function getEmotionAnimations() {
  return emotionAnimations;
}

// 工具函数：获取所有口型动画
export function getVisemeAnimations() {
  return visemeAnimations;
}

// 工具函数：根据类型获取动画
export function getAnimationsByType(type: AnimationType) {
  switch (type) {
    case AnimationType.ACTION:
      return actionAnimations;
    case AnimationType.EMOTION:
      return emotionAnimations;
    case AnimationType.VISEME:
      return visemeAnimations;
    default:
      return [];
  }
}
