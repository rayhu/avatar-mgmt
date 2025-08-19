# 数字人形象管理前端

## 1. 功能特性总结

### 🎯 核心功能

- **3D渲染**：基于 Three.js 的高质量3D模型展示
- **语音合成**：集成 Azure TTS 和 OpenAI SSML 生成
- **版本管理**：完整的模型版本控制和状态管理系统
- **集成工作流**：从模型浏览到功能使用的一体化体验

### 👥 用户管理

- **权限分级**：管理员分配账号（无自助注册）
- **状态过滤**：管理员可见全部模型，普通用户只看"就绪"状态模型
- **角色差异**：不同角色享有不同的功能访问权限

### 📊 数据管理

- **元数据管理**：描述、标签、用途、版本等完整信息
- **状态流转**：草稿 → 待审核 → 处理中 → 就绪 → 错误
- **实时更新**：状态变更实时反映在界面上

### 🎨 用户体验

- **响应式设计**：完美适配桌面端和移动端
- **简化导航**：集成式操作界面，减少页面跳转
- **直观操作**：模型卡片直接包含所有相关功能按钮

## 2. 后端（Directus）数据结构集成

### 主要集合设计

#### `avatars` (核心模型集合)

- **name** - 模型名称
- **description** - 模型描述
- **tags** - 标签（JSON格式）
- **purpose** - 用途（客服、品牌、主持人、AI助手）
- **style** - 风格（卡通、写实、未来感、国风）
- **main_file** - 3D模型主文件（UUID，关联directus_files）
- **preview_image** - 预览图片（UUID，关联directus_files）
- **version** - 版本号（如：1.0.0）
- **status** - 状态枚举：
  - `draft` - 草稿
  - `pending` - 待审核
  - `processing` - 处理中
  - `ready` - 就绪
  - `error` - 错误

#### 内置集合

- **users** - 用户管理
- **roles** - 角色权限
- **directus_files** - 文件存储

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

## 4. 用户界面与工作流程

### 4.1. 导航结构 (简化设计)

#### 主导航菜单

- **模型管理** (`/admin`) - 仅管理员可见
- **模型展示** (`/user`) - 所有用户可见

#### 集成操作界面

取消了独立的"语音动画导出"和"动作表情测试"页面，所有功能现在集成在模型卡片中：

```
模型展示页面
├── 模型卡片1
│   ├── 🎬 语音动画导出 (主要功能)
│   └── 🧪 动作表情测试 (测试功能)
├── 模型卡片2
│   ├── 🎬 语音动画导出
│   └── 🧪 动作表情测试
└── ...
```

### 4.2. 用户体验流程

#### 简化的操作流程

```
用户登录 → 模型展示 → 选择模型 → 直接使用功能
```

**vs 旧流程**：

```
用户登录 → 模型展示 → 返回菜单 → 语音动画页面 → 重新选择模型
```

### 4.3. 权限与功能分配

#### 管理员权限

- ✅ 模型管理：CRUD操作、状态管理、版本控制
- ✅ 元数据编辑：名称、描述、版本、状态等
- ✅ 所有功能：语音动画导出、动作表情测试
- ✅ 查看所有状态的模型

#### 普通用户权限

- ✅ 模型浏览：仅查看"就绪"状态模型
- ✅ 功能使用：语音动画导出、动作表情测试
- ❌ 管理功能：无法编辑模型信息

## 5. 核心技术组件

### 5.1. 模型版本管理系统

#### 新增API端点

- `PUT /api/avatars/:id` - 更新模型状态和版本
- `PATCH /api/avatars/:id` - 部分更新模型信息

#### 前端组件

- `EditAvatarModal.vue` - 模型编辑对话框
- `avatar-management.ts` - 版本管理API调用

#### 数据库架构更新

```sql
-- 新增字段
ALTER TABLE avatars ADD COLUMN version VARCHAR(255) DEFAULT '1.0.0';
ALTER TABLE avatars ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
```

### 5.2. 3D模型渲染

`ModelViewer.vue` 组件基于 Three.js 实现：

- 支持 GLB/GLTF/OBJ 等格式
- 动态加载 Directus 文件 API 资源
- 响应式3D视口

### 5.3. 语音动画系统

`Animate.vue` 集成页面：

- Azure TTS 语音合成
- OpenAI SSML 标记生成
- Three.js 动画时间轴
- 移动端优化的时间标记

### 5.4. 状态管理

支持完整的模型生命周期：

```
草稿 → 待审核 → 处理中 → 就绪 → [错误]
```

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
