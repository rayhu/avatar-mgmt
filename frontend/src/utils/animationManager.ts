/**
 * 动画管理器
 * 统一管理动画的播放、状态和事件
 */

import { logger } from './logger';
import { 
  Animation, 
  AnimationType, 
  AnimationState, 
  AnimationEvent, 
  AnimationManager as IAnimationManager 
} from '@/types/animation';
import { 
  getAnimationByCallName, 
  getAnimationByActualName, 
  getAnimationsByType 
} from '@/config/animations';

export class AnimationManager implements IAnimationManager {
  private animations: Animation[] = [];
  private currentState: AnimationState = {
    isPlaying: false,
    progress: 0
  };
  private eventListeners: Map<string, ((event: AnimationEvent) => void)[]> = new Map();
  private modelViewer: any = null;

  constructor() {
    logger.info('动画管理器初始化', {
      component: 'AnimationManager',
      method: 'constructor'
    });
  }

  // 设置模型查看器引用
  setModelViewer(viewer: any) {
    this.modelViewer = viewer;
    logger.info('设置模型查看器', {
      component: 'AnimationManager',
      method: 'setModelViewer'
    });
  }

  // 获取所有动画
  getAllAnimations(): Animation[] {
    return this.animations;
  }

  // 根据类型获取动画
  getAnimationsByType(type: AnimationType): Animation[] {
    return getAnimationsByType(type);
  }

  // 根据调用名称获取动画
  getAnimationByCallName(callName: string): Animation | undefined {
    return getAnimationByCallName(callName);
  }

  // 根据实际名称获取动画
  getAnimationByActualName(actualName: string): Animation | undefined {
    return getAnimationByActualName(actualName);
  }

  // 播放动画
  async playAnimation(callName: string): Promise<void> {
    const animation = this.getAnimationByCallName(callName);
    if (!animation) {
      logger.error('动画不存在', {
        component: 'AnimationManager',
        method: 'playAnimation',
        callName
      });
      throw new Error(`Animation not found: ${callName}`);
    }

    if (!animation.enabled) {
      logger.warn('动画已禁用', {
        component: 'AnimationManager',
        method: 'playAnimation',
        callName,
        actualName: animation.actualName
      });
      return;
    }

    try {
      logger.info('开始播放动画', {
        component: 'AnimationManager',
        method: 'playAnimation',
        callName,
        actualName: animation.actualName,
        displayName: animation.displayName
      });

      // 根据动画类型执行不同的播放逻辑
      switch (animation.type) {
        case AnimationType.ACTION:
          await this.playActionAnimation(animation);
          break;
        case AnimationType.EMOTION:
          await this.playEmotionAnimation(animation);
          break;
        case AnimationType.VISEME:
          await this.playVisemeAnimation(animation);
          break;
        default:
          throw new Error(`Unknown animation type: ${animation.type}`);
      }

      // 更新状态
      this.currentState.isPlaying = true;
      this.currentState.progress = 0;

      // 触发事件
      this.emit('start', {
        type: 'start',
        animation,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('播放动画失败', {
        component: 'AnimationManager',
        method: 'playAnimation',
        callName,
        error: error instanceof Error ? error.message : String(error)
      });

      this.emit('error', {
        type: 'error',
        animation,
        timestamp: Date.now(),
        data: error
      });

      throw error;
    }
  }

  // 播放动作动画
  private async playActionAnimation(animation: Animation): Promise<void> {
    if (!this.modelViewer) {
      throw new Error('Model viewer not set');
    }

    if (this.modelViewer.playAnimation) {
      await this.modelViewer.playAnimation(animation.actualName);
    } else {
      logger.warn('模型查看器不支持动作动画', {
        component: 'AnimationManager',
        method: 'playActionAnimation',
        actualName: animation.actualName
      });
    }
  }

  // 播放表情动画
  private async playEmotionAnimation(animation: Animation): Promise<void> {
    if (!this.modelViewer) {
      throw new Error('Model viewer not set');
    }

    if (this.modelViewer.updateEmotion) {
      await this.modelViewer.updateEmotion(animation.actualName);
    } else {
      logger.warn('模型查看器不支持表情动画', {
        component: 'AnimationManager',
        method: 'playEmotionAnimation',
        actualName: animation.actualName
      });
    }
  }

  // 播放口型动画
  private async playVisemeAnimation(animation: Animation): Promise<void> {
    if (!this.modelViewer) {
      throw new Error('Model viewer not set');
    }

    if (this.modelViewer.updateViseme) {
      await this.modelViewer.updateViseme(animation.visemeId);
    } else {
      logger.warn('模型查看器不支持口型动画', {
        component: 'AnimationManager',
        method: 'playVisemeAnimation',
        visemeId: animation.visemeId
      });
    }
  }

  // 停止动画
  stopAnimation(): void {
    logger.info('停止动画', {
      component: 'AnimationManager',
      method: 'stopAnimation'
    });

    this.currentState.isPlaying = false;
    this.currentState.progress = 0;

    // 触发停止事件
    this.emit('end', {
      type: 'end',
      animation: {} as Animation, // 空动画对象
      timestamp: Date.now()
    });
  }

  // 获取当前状态
  getCurrentState(): AnimationState {
    return { ...this.currentState };
  }

  // 监听动画事件
  on(event: string, callback: (event: AnimationEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // 移除事件监听
  off(event: string, callback: (event: AnimationEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 触发事件
  private emit(event: string, data: AnimationEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('事件回调执行失败', {
            component: 'AnimationManager',
            method: 'emit',
            event,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
    }
  }

  // 更新动画进度
  updateProgress(progress: number): void {
    this.currentState.progress = Math.max(0, Math.min(1, progress));
    
    this.emit('progress', {
      type: 'progress',
      animation: {} as Animation,
      timestamp: Date.now(),
      data: { progress: this.currentState.progress }
    });
  }

  // 检查动画是否可用
  isAnimationEnabled(callName: string): boolean {
    const animation = this.getAnimationByCallName(callName);
    return animation?.enabled ?? false;
  }

  // 获取动画信息
  getAnimationInfo(callName: string) {
    const animation = this.getAnimationByCallName(callName);
    if (!animation) {
      return null;
    }

    return {
      callName: animation.callName,
      actualName: animation.actualName,
      displayName: animation.displayName,
      type: animation.type,
      description: animation.description,
      enabled: animation.enabled
    };
  }

  // 批量播放动画序列
  async playAnimationSequence(sequence: string[]): Promise<void> {
    logger.info('开始播放动画序列', {
      component: 'AnimationManager',
      method: 'playAnimationSequence',
      sequence
    });

    for (const callName of sequence) {
      try {
        await this.playAnimation(callName);
        // 等待一小段时间再播放下一个动画
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error('动画序列播放失败', {
          component: 'AnimationManager',
          method: 'playAnimationSequence',
          callName,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  }

  // 清理资源
  dispose(): void {
    logger.info('清理动画管理器', {
      component: 'AnimationManager',
      method: 'dispose'
    });

    this.eventListeners.clear();
    this.modelViewer = null;
    this.currentState = {
      isPlaying: false,
      progress: 0
    };
  }
}

// 创建全局动画管理器实例
export const animationManager = new AnimationManager(); 
