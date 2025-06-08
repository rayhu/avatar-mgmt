# This repo is for avata management website.


数字人形象库管理网站的核心需求：
✅ 形象管理：上传、编辑、删除数字人形象。
✅ 元数据管理：形象属性（如名字、用途、风格等）管理。
✅ 预览和展示：可视化预览形象，包括动画或静态图。
✅ 权限和用户管理：不同用户角色（如管理员、设计师、使用者等）权限控制。
✅ API 接口：供前台客服端调用数字人形象数据（如客服数字人前台对接等）。

选择 Directus

Directus (开源)
Node.js（Express）实现；直接对接现有SQL数据库（MySQL/PostgreSQL等），在其上即时生成API ；提供基于Vue的管理界面
文件支持：Directus 将文件存储交由自定义存储（本地或云），数据库中有 directus_files 表追踪文件元数据 ；可上传任意类型文件；预览：后台对图像提供缩略图，对PDF/视频等有预览插件（社区有扩展支持3D模型预览）
细粒度权限：提供字段级、记录级的权限配置，可为不同角色设置精细到字段的CRUD权限 ；适合复杂数据权限场景；内置用户与角色管理界面，支持对非技术用户友好的权限分配
API：自动生成完整的 REST API 和 GraphQL API ；实时订阅支持（WebSocket）用于数据变更推送 ；扩展性：通过 Extensions 可扩展接口、定制界面组件等，但整体插件生态不如 Strapi 丰富（功能多数已内置核心）
成熟度：核心代码活跃维护，v9/v10版本稳定用于生产；社区规模中等偏上（GitHub Star ~2万）；强调无代码和直观UI，学习成本低 ；企业适用：被视为企业级就绪的平台，注重与SQL数据直接交互，可靠性高 。



启动服务
```
docker-compose up -d
```

访问管理后台

浏览器打开 http://localhost:8055

初始账号：
邮箱：admin@example.com
密码：admin1234

停止/重启/清理

docker-compose stop      # 停止
docker-compose start     # 启动
docker-compose down      # 停止并清理容器


本地数据/扩展说明
	•	所有文件、数据库都映射在本地目录（db_data、uploads），方便数据迁移和备份。
	•	可以随时重启、升级或复制环境。


