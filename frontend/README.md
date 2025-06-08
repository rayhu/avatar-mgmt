## 1. 需求要点总结

3D渲染：使用 three.js

语音合成：使用 Azure TTS

用户管理：仅管理员分配账号（无自助注册）

模型状态：有"就绪"状态，管理员可见全部，普通用户只能看到"就绪"模型

元数据管理：模型需有描述、标签、用途等元数据

版本管理：模型支持多版本

评论与点赞：支持用户评论和点赞模型


## 2. 后端（Directus）数据结构建议

集合设计

users（内置）

roles（内置）

models

name

description

tags

purpose

file（3D模型主文件）

preview_image

status（enum: 草稿/就绪/下线等）

owner（上传者，relation: users）

created_at, updated_at

model_versions

model_id（relation: models）

file（历史版本文件）

version_number

changelog

created_at

comments

model_id（relation: models）

user_id（relation: users）

content

created_at

likes

model_id（relation: models）

user_id（relation: users）

created_at


## 3. 前端（Vue 3 + Vite）目录结构建议

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

登录后根据 Directus 用户角色（admin/user）显示不同页面。

管理员可管理所有模型、用户、评论、版本。

普通用户只能浏览"就绪"模型，进行评论和点赞。

### 4.2. 模型管理

管理员：

上传/编辑/删除模型

设置模型状态（如"就绪"）

管理模型元数据

管理模型版本（上传新版本、查看历史版本）

普通用户：

浏览"就绪"模型

查看模型详情、历史版本

评论和点赞??

### 4.3. 3D模型预览

用 three.js 实现 ModelViewer.vue，支持加载 Directus 文件 API 返回的 3D 文件（如 glb/gltf/obj）。

### 4.4. 动画与语音

Animate.vue 页面：输入文字、选择表情/动作，驱动 three.js 动画，并调用 Azure TTS 合成语音播放。

### 4.5. 评论与点赞
CommentList.vue：展示和提交评论
LikeButton.vue：点赞/取消点赞

## 5. 目录与文件举例

src/api/directus.ts：Directus API 封装（登录、模型、评论、点赞等）

src/api/azureTTS.ts：Azure TTS API 封装

src/components/ModelViewer.vue：three.js 3D模型预览

src/components/ModelVersionList.vue：模型版本管理

src/components/CommentList.vue：评论列表与表单

src/components/LikeButton.vue：点赞按钮

src/views/Admin/ModelList.vue：管理员模型列表

src/views/User/ModelGallery.vue：用户模型画廊

src/views/Animate.vue：动画与语音页面


## 6. 包管理器 (Yarn)

本项目使用 Yarn 作为包管理器。以下是常用的 Yarn 命令：

### 6.1 基本命令
```bash
# 安装所有依赖
yarn

# 添加新的依赖
yarn add [package]

# 添加新的开发依赖
yarn add -D [package]

# 移除依赖
yarn remove [package]
```

### 6.2 开发命令
```bash
# 启动开发服务器
yarn dev

# 构建生产版本
yarn build

# 预览生产构建
yarn preview

# 运行 ESLint
yarn lint

# 使用 Prettier 格式化代码
yarn format

# 运行 TypeScript 类型检查
yarn type-check
```

### 6.3 注意事项
1. 请确保团队成员都使用 Yarn 而不是 npm，以保持一致性
2. yarn.lock 文件已提交到版本控制系统中，请勿手动修改
3. 如果遇到依赖问题，可以尝试以下步骤：
   ```bash
   rm -rf node_modules
   rm yarn.lock
   yarn install
   ```

## 7. 安装与运行

1. 安装依赖：
```bash
yarn install
```

2. 启动开发服务器：
```bash
yarn dev
```

3. 构建生产版本：
```bash
yarn build
```


管理员账号：
用户名：admin
密码：admin123
普通用户账号：
用户名：user
密码：user123
登录后：
管理员账号会跳转到 /admin 页面
普通用户账号会跳转到 /user 页面
这些是临时的测试账号，后续会实现真正的 Directus API 登录。