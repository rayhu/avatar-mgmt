# 本代码库是数字人形象库管理网站


数字人形象库管理网站的核心需求：

✅ 形象管理：上传、编辑、删除数字人形象。

✅ 元数据管理：形象属性（如名字、用途、风格等）管理。

✅ 预览和展示：可视化预览形象，包括动画或静态图。

✅ 权限和用户管理：不同用户角色（如管理员、设计师、使用者等）权限控制。

✅ API 接口：供前台客服端调用数字人形象数据（如客服数字人前台对接等）。


选择 Directus

Directus（开源）

技术栈：基于 Node.js（Express）实现，直接对接现有 SQL 数据库（如 MySQL、PostgreSQL 等），在其上即时生成 API。管理界面基于 Vue 构建，界面直观易用。

文件支持：Directus 支持自定义文件存储（本地或云端），数据库中的 directus_files 表用于追踪文件元数据。可上传任意类型文件。

文件预览：后台可对图片生成缩略图，对 PDF、视频等文件类型支持预览。社区有扩展插件支持 3D 模型等特殊格式的预览。

细粒度权限：支持字段级、记录级的权限配置，可为不同角色设置精细的 CRUD 权限。内置用户与角色管理界面，便于非技术用户分配权限，适合复杂数据权限场景。

API 支持：自动生成完整的 REST API 和 GraphQL API，方便前后端集成。

实时订阅：支持 WebSocket 实时推送数据变更，便于构建实时应用。

扩展性：通过 Extensions 可扩展接口、定制后台界面组件。虽然插件生态不如 Strapi 丰富，但核心功能大多已内置。

成熟度与社区：核心代码活跃维护，v9/v10/v11 版本已广泛用于生产环境。社区规模中等偏上（GitHub Star 约 2 万）。强调无代码和直观 UI，学习成本低，适合企业级应用，注重与 SQL 数据的直接交互，可靠性高。

## 部署信息

项目已部署在 Vercel 上：
- 主域名：https://amis-avatar-mgmt.vercel.app
- 预览域名：https://amis-avatar-mgmt-d4s2fjsmm-rays-projects-83e166d9.vercel.app

部署命令：
```bash
npx vercel --prod
```

## 本地开发

启动服务
```bash
docker-compose up -d
```

访问管理后台

浏览器打开 http://localhost:8055

初始账号：
邮箱：admin@example.com
密码：admin1234

停止/重启/清理

```bash
docker-compose stop      # 停止
docker-compose start     # 启动
docker-compose down      # 停止并清理容器
```

本地数据/扩展说明
- 所有文件、数据库都映射在本地目录（db_data、uploads、db_json、schemas），方便数据迁移和备份。
- 可以随时重启、升级或复制环境。


