# 3D 模型查看器前端

## 1. 需求要点总结

- 3D渲染：使用 three.js
- 语音合成：使用 Azure TTS
- 用户管理：仅管理员分配账号（无自助注册）
- 模型状态：有"就绪"状态，管理员可见全部，普通用户只能看到"就绪"模型
- 元数据管理：模型需有描述、标签、用途等元数据
- 版本管理：模型支持多版本
- 评论与点赞：支持用户评论和点赞模型

## 2. 后端（Directus）数据结构集成

### 集合设计

- users（内置）
- roles（内置）
- models
  - name
  - description
  - tags
  - purpose
  - file（3D模型主文件）
  - preview_image
  - status（enum: 草稿/就绪/下线等）
  - owner（上传者，relation: users）
  - created_at, updated_at
- model_versions
  - model_id（relation: models）
  - file（历史版本文件）
  - version_number
  - changelog
  - created_at
- comments
  - model_id（relation: models）
  - user_id（relation: users）
  - content
  - created_at
- likes
  - model_id（relation: models）
  - user_id（relation: users）
  - created_at

## 3. 前端（Vue 3 + Vite）目录结构

```
/frontend
  ├── public/
  ├── src/
  │   ├── api/                # Directus API 封装、Azure TTS 封装
  │   │   ├── directus.ts
  │   │   └── azureTTS.ts
  │   ├── assets/
  │   ├── components/
  │   │   ├── ModelViewer.vue         # three.js 3D模型预览
  │   │   ├── ModelVersionList.vue    # 版本管理
  │   │   ├── CommentList.vue         # 评论组件
  │   │   └── LikeButton.vue          # 点赞组件
  │   ├── views/
  │   │   ├── Login.vue
  │   │   ├── Admin/
  │   │   │   ├── ModelList.vue
  │   │   │   ├── ModelEdit.vue
  │   │   │   └── UserList.vue
  │   │   ├── User/
  │   │   │   ├── ModelGallery.vue
  │   │   │   └── ModelDetail.vue
  │   │   ├── Animate.vue             # 动画渲染与语音页面
  │   ├── router/
  │   ├── store/
  │   ├── utils/
  │   ├── App.vue
  │   └── main.ts
  ├── package.json
  └── vite.config.ts
```

## 4. 关键功能设计

### 4.1. 登录与权限

- 登录后根据 Directus 用户角色（admin/user）显示不同页面
- 管理员可管理所有模型、用户、评论、版本
- 普通用户只能浏览"就绪"模型，进行评论和点赞

### 4.2. 模型管理

管理员：
- 上传/编辑/删除模型
- 设置模型状态（如"就绪"）
- 管理模型元数据
- 管理模型版本（上传新版本、查看历史版本）

普通用户：
- 浏览"就绪"模型
- 查看模型详情、历史版本
- 评论和点赞

### 4.3. 3D模型预览

用 three.js 实现 ModelViewer.vue，支持加载 Directus 文件 API 返回的 3D 文件（如 glb/gltf/obj）。

### 4.4. 动画与语音

Animate.vue 页面：输入文字、选择表情/动作，驱动 three.js 动画，并调用 Azure TTS 合成语音播放。

### 4.5. 评论与点赞

- CommentList.vue：展示和提交评论
- LikeButton.vue：点赞/取消点赞

## 5. 当前功能实现

### 5.1 动画控制
- [x] Idle（待机）
- [x] Walking（行走）
- [x] Running（奔跑）
- [x] Jump（跳跃）
- [x] Wave（挥手）
- [x] Dance（舞蹈）
- [x] Death（死亡）
- [x] No（摇头）
- [x] Punch（出拳）
- [x] Sitting（坐下）
- [x] Standing（站立）
- [x] ThumbsUp（点赞）
- [x] WalkJump（行走跳跃）
- [x] Yes（点头）

### 5.2 表情控制
- [x] Neutral（中性/默认表情）
- [x] Angry（生气）
- [x] Surprised（惊讶）
- [x] Sad（悲伤）

### 5.3 模型控制
- [x] 鼠标左键拖动：旋转模型
- [x] 鼠标右键拖动：平移模型
- [x] 鼠标滚轮：缩放模型

## 6. 计划功能

### 6.1 动画控制增强
- [ ] 动画播放速度调节
- [ ] 动画循环控制
- [ ] 动画混合过渡
- [ ] 动画序列播放
- [ ] 动画暂停/继续
- [ ] 动画进度条控制

### 6.2 表情控制增强
- [ ] 表情强度调节
- [ ] 表情混合效果
- [ ] 表情过渡动画
- [ ] 自定义表情组合
- [ ] 表情预设保存/加载

### 6.3 场景控制
- [ ] 背景颜色/图片自定义
- [ ] 光照效果调整
- [ ] 相机视角预设
- [ ] 环境贴图支持
- [ ] 阴影效果控制
- [ ] 后期处理效果

### 6.4 模型控制增强
- [ ] 模型缩放精确控制
- [ ] 模型位置重置
- [ ] 模型旋转角度限制
- [ ] 模型碰撞检测
- [ ] 模型物理效果

### 6.5 媒体功能
- [ ] 截图功能
- [ ] 动画录制
- [ ] 视频导出
- [ ] 模型分享
- [ ] 场景分享

### 6.6 用户界面优化
- [ ] 响应式布局优化
- [ ] 暗色主题支持
- [ ] 快捷键支持
- [ ] 操作提示
- [ ] 状态保存/恢复

### 6.7 性能优化
- [ ] 模型加载优化
- [ ] 动画性能优化
- [ ] 内存管理优化
- [ ] 渲染性能优化
- [ ] 资源预加载

### 6.8 开发工具
- [ ] 调试模式
- [ ] 性能监控
- [ ] 错误追踪
- [ ] 开发文档
- [ ] API 文档

## 7. 技术栈

- Vue 3
- TypeScript
- Three.js
- Vite
- SCSS
- Directus
- Azure TTS

## 8. 开发环境设置

### 8.1 包管理器

本项目使用 Yarn 作为包管理器。首先确保你已经安装了 Yarn：

```bash
# 安装 Yarn
npm install -g yarn

# 验证安装
yarn --version
```

### 8.2 项目依赖

```bash
# 安装依赖
yarn install

# 添加新依赖
yarn add <package-name>

# 添加开发依赖
yarn add -D <package-name>

# 移除依赖
yarn remove <package-name>

# 更新依赖
yarn upgrade
```

### 8.3 开发命令

```bash
# 启动开发服务器
yarn dev

# 构建生产版本
yarn build

# 预览生产构建
yarn preview

# 代码检查
yarn lint

# 代码格式化
yarn format

# 运行测试
yarn test

# 运行类型检查
yarn type-check
```

### 8.4 其他命令

```bash
# 清理缓存
yarn cache clean

# 清理依赖
yarn clean

# 重新安装依赖
yarn reinstall
```

## 9. 测试账号

管理员账号：
- 用户名：admin
- 密码：admin123

普通用户账号：
- 用户名：user
- 密码：user123

登录后：
- 管理员账号会跳转到 /admin 页面
- 普通用户账号会跳转到 /user 页面

这些是临时的测试账号，后续会实现真正的 Directus API 登录。

## 10. 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request
