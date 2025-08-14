用 Directus 搭建数字人形象库的技术路线

1. 架构
	•	前端：Vue（或 Next.js）+ three.js / <model-viewer> 预览3D模型，Video.js 预览视频，普通图片用 <img>。
	•	后端：Directus 自带后台管理 + REST/GraphQL API 提供所有数据接口。
	•	存储：可用本地磁盘、阿里OSS、腾讯COS、Amazon S3 等，对大文件友好。
	•	用户权限：后台可灵活配置管理员、设计师、前台用户等角色，按需开放"上传、编辑、查看、下载"等权限。
	•	API 对接：前端通过 Directus API 实时获取数据和媒体文件列表。

## 前端架构

### UI 组件
- 使用现代化的卡片设计
- 统一的白色背景和阴影效果
- 响应式布局
- 骨架屏加载效果

### 样式规范
- 页面内边距：32px
- 卡片内边距：24px
- 圆角：8px
- 阴影：0 2px 12px rgba(0, 0, 0, 0.1)
- 主色调：#42b883

### 组件结构
- 导航栏：响应式设计，根据用户角色显示不同菜单
- 模型列表：卡片式布局，支持搜索和筛选
- 动画编辑器：时间轴控制，支持关键帧编辑
- 预览区域：3D模型展示，支持动画和表情控制

⸻

2. Directus 实现步骤
	1.	搭建 Directus
	•	官方文档有详细指引。可本地Docker部署或云主机部署，推荐用 Docker。
	•	安装示例命令：

npx create-directus-project my-digital-human
cd my-digital-human
npx directus start


	2.	数据模型设计
	•	新建"数字人形象"集合（Collection），如：avatars。
	•	字段建议：
	•	名称（text）、用途（select/多选）、风格（select/多选）、说明（text/markdown）、上传者（user relation）
	•	形象主文件（file 字段，支持GLB、MP4等）
	•	预览图（file）
	•	多附件/多格式资源（多个 file 字段或建关联表）
	•	自定义元数据字段，可随时调整。
	3.	权限和用户管理
	•	在"角色与权限"里配置不同角色（管理员/设计师/普通用户）：
	•	谁能新建、编辑、删除、查看形象
	•	谁能上传下载文件
	•	谁只能只读访问API
	•	支持"字段级/记录级"细分权限。
	4.	文件与媒体支持
	•	默认支持几乎所有文件类型。GLB、FBX、MP4等3D/视频文件可直接上传。
	•	前端展示时可直接取 Directus 文件URL，或用 API 获得下载链接。
	•	后台对图片、常见视频有预览。3D/特殊格式可以通过前端自定义组件来预览（如 <model-viewer>、three.js）。
	5.	API 对接
	•	REST API:  /items/avatars（列表/详情/筛选）
	•	GraphQL API: /graphql，支持灵活查询
	•	可配置 API 认证，保障数据安全。
	6.	前端集成
	•	React/Next.js 中通过 Directus SDK、axios 或 fetch 直接调API。
	•	图片直接 <img src="文件url" />，视频用 <video>，3D模型用 <model-viewer> 或三方3D组件。
	•	可以做高级筛选/分类展示，按元数据字段检索。
	7.	二次开发/扩展
	•	Directus 支持自定义扩展（Extensions），可加自定义接口/后台界面小部件。
	•	如后台要直接3D模型预览，可开发 Extension 集成 <model-viewer> 组件。

⸻

3. 典型 Directus 数字人形象库架构图

[管理员/设计师]        [普通用户]
      │                    │
      ▼                    ▼
   Directus后台         React前端
      │         ←API→       │
 ┌──────────────┐          ┌───────────────┐
 │数据库+文件存储 │          │3D/视频/图片预览 │
 └──────────────┘          └───────────────┘


⸻

4. 推荐资料
	•	Directus 官方文档
https://docs.directus.io/
	•	API 文档（REST & GraphQL）
https://docs.directus.io/reference/api/
	•	官方示例与插件
https://market.directus.io/
	•	React 集成示例
https://docs.directus.io/guides/integrations/react/


⸻

5. Directus 11.8.0 数据模型格式要求  

- 字段定义中**不要使用** `display` 和 `display_options` 字段，除非官方文档明确支持（如 `raw`、`boolean`、`datetime` 等）。
- 普通字符串、文本、下拉选择、文件、标签等字段，只需指定 `interface`、`options`、`required`、`note` 等属性。
- 典型字段定义示例（Example）：

```json
{
  "collection": "avatars",
  "field": "name",
  "type": "string",
  "meta": {
    "interface": "input",
    "required": true,
    "note": "形象名称"
  }
}
```

- select-dropdown 类型示例（Example for select-dropdown）：

```json
{
  "collection": "avatars",
  "field": "purpose",
  "type": "string",
  "meta": {
    "interface": "select-dropdown",
    "options": {
      "choices": [
        { "text": "客服", "value": "客服" },
        { "text": "品牌", "value": "品牌" }
      ]
    }
  }
}
```

- textarea、file、tags 类型同理，只需 `interface`，无需 `display`。
- 如需自定义显示方式，请查阅 [Directus 11.8.0 官方文档](https://docs.directus.io/reference/displays/)，仅使用该版本支持的 display 类型。

/avatar-mgmt
  ├── db_data/         # Postgres 数据库持久化数据（由 Docker 自动管理）
  ├── db_json/         # 自定义的 schema、数据备份、导入导出用的 json 文件
  ├── schemas/         # Directus 官方 schema 快照（snapshot.json/yaml），用于 CLI apply/迁移
  ├── uploads/         # Directus 文件上传目录（图片、视频、3D模型等）
  ├── extensions/      # Directus 扩展（自定义接口、后台小部件等）
  ├── docker-compose.yml
  ├── DIRECTUS.md



db_json 目录：
	用途：
	存放自定义的数据结构、集合定义、字段定义等 json 文件。
	可以用来做数据备份、导入导出、手动编辑等。
	适合团队内部交流、版本管理、手动维护。
	不是 Directus 官方标准的 schema 快照目录，CLI 工具不会自动识别这里的文件。


schemas：只放 Directus CLI 直接用的 snapshot 文件（如 snapshot.json），用于结构迁移和自动化部署。


⸻

6. 导入执行：


具体执行：
先备份当前 schema：
```
docker compose exec directus npx directus schema snapshot schemas/backup-before-apply.json
```

用 dry-run 预览变更：
```
docker compose exec directus npx directus schema apply --dry-run schemas/snapshot.json
```
在repo根目录进行实际导入，不需要修改后面的路径，那些是已经映射好的路径
```
docker compose -f docker-compose.prod.yml exec directus npx directus schema apply --yes schemas/snapshot.yml 
```
or
docker compose -f docker-compose.dev.yml exec directus npx directus schema apply --yes schemas/snapshot.yml 

7. 权限

为了方便前端分享给不特定群体，允许直接查看缩略图。

```
yarn node-fetch

export DIRECTUS_URL=http://localhost:8055
export DIRECTUS_ADMIN_EMAIL=admin@example.com
export DIRECTUS_ADMIN_PASSWORD=your_admin_password

node setup-directus-permissions.js


```
脚本会自动检测是否已存在权限和策略，不会重复创建，可以安全多次运行。

#### 自行检查也可查看 Public 在 Directus_files上的权限
http://directus.daidai.localhost:8055/admin/settings/policies
