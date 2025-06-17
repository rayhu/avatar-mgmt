# 部署指南

## Vercel 部署

1. 确保代码已提交到主分支
2. 执行部署命令：
   ```bash
   npx vercel --prod
   ```

## 域名配置

项目使用以下域名：
- 主域名：https://amis-avatar-mgmt.vercel.app
- 预览域名：https://amis-avatar-mgmt-d4s2fjsmm-rays-projects-83e166d9.vercel.app

## 环境要求

- Node.js 16+
- Vercel CLI

## 部署流程

1. 开发环境
   - 使用 `npx vercel` 部署到预览环境
   - 自动生成预览域名
   - 适合测试和代码审查

2. 生产环境
   - 使用 `npx vercel --prod` 部署到生产环境
   - 自动部署到主域名
   - 确保代码已通过测试

## 环境变量

确保以下环境变量已正确配置：
- `VITE_API_URL`: API 服务器地址
- `VITE_DIRECTUS_URL`: Directus 服务器地址
- `VITE_DIRECTUS_TOKEN`: Directus 访问令牌

## 故障排除

1. 部署失败
   - 检查 Node.js 版本
   - 确认所有依赖已正确安装
   - 查看 Vercel 部署日志

2. 环境变量问题
   - 在 Vercel 项目设置中检查环境变量
   - 确保所有必需的环境变量都已设置

3. 构建错误
   - 检查 `package.json` 中的构建脚本
   - 确认所有依赖版本兼容
   - 查看构建日志获取详细错误信息

## 回滚部署

如果需要回滚到之前的版本：
1. 在 Vercel 仪表板中找到之前的部署
2. 点击 "..." 菜单
3. 选择 "Promote to Production"

## 监控和维护

- 使用 Vercel Analytics 监控应用性能
- 定期检查部署日志
- 保持依赖包更新
- 定期备份数据

## Docker 生产部署（内部服务器）

> 适用于 **小赢生产环境**，使用 `docker-compose.prod.yml` 一键启动 Directus、API Server、Postgres 与 Nginx。Vercel 仅用于开发测试，两套部署方式互不影响。

### 准备工作
1. 在目标服务器安装 Docker & Compose：
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo apt-get install -y docker-compose-plugin   # Linux
   ```
2. 克隆仓库到 `/opt/avatar-mgmt`（或任意目录）。
3. 复制或编辑 `.env` 并填写生产凭据：
   ```dotenv
   # Directus
   KEY=supersecretkey
   SECRET=supersecretsecret
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=StrongPwd123
   DB_CLIENT=postgres
   DB_HOST=db
   DB_PORT=5432
   DB_DATABASE=directus
   DB_USER=directus
   DB_PASSWORD=directus

   # OpenAI
   OPENAI_API_KEY=sk-xxxx
   # Azure Speech
   AZURE_SPEECH_KEY=your-azure-key
   AZURE_SPEECH_REGION=eastasia
   ```

### 启动命令
```bash
# 首次启动（含构建镜像）
docker compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker compose -f docker-compose.prod.yml logs -f
```

### 默认端口
| 服务 | 端口 | 说明 |
| ---- | ---- | ---- |
| Directus | 8055 (内部) / 80 (外部 Nginx) | `/admin` 后台 |
| API Server | 3000 (内部) / 80 | `/api/*` |
| Postgres | 5432 (内部) | 仅内部访问 |

> 若 80/443 被占用，可修改 `docker-compose.prod.yml` 中 `nginx` 的 `ports` 映射，如 `"8080:80"`。

### 备份与恢复
- **Schema**：`directus schema snapshot schemas/snapshot.json`
- **数据库**：`pg_dump -Fc -d directus > backup_$(date +%F).dump`
- **文件**：`tar czf uploads_$(date +%F).tgz uploads/`

恢复顺序：数据库 → Schema Apply → 解压 uploads。

### 常见问题排查（Docker）
| 症状 | 日志关键词 | 解决方案 |
| ---- | ---------- | -------- |
| Nginx 报 `host not found in upstream "directus"` | nginx | 确保 `directus` 容器已启动，且 `docker compose restart nginx` 后重新解析 DNS |
| API 报 `ERR_UNKNOWN_FILE_EXTENSION ".ts"` | api | `package.json` 中 `start` 使用 `tsx index.ts`，重建镜像 `docker compose build --no-cache api` |
| API 返回 `OPENAI_API_KEY is not configured.` | api | 在 `.env` 填入有效 `OPENAI_API_KEY`，并 `docker compose up -d --build api` |
| Directus 连接 `::1:54321` 失败 | directus | `.env` 中 `DB_HOST=db`、`DB_PORT=5432`，不要写宿主端口 |

> 建议每次修改 `.env` 或 Dockerfile 后使用 `docker compose build --no-cache` 强制重建，避免旧缓存。

## 本地 Docker 测试

1. 使用测试凭据创建 `.env` 文件（可复用上面模板）。
2. 运行：
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
3. 访问：
   - `http://localhost/admin` Directus 后台
   - `http://localhost/api/openai-ssml` POST 测试 `{ "text":"你好" }`
   - `http://localhost/health` API 健康检查
4. 停止并清理：
   ```bash
   docker compose -f docker-compose.prod.yml down   # 保留数据卷
   # or
   docker compose -f docker-compose.prod.yml down -v # 删除数据卷（慎用）
   ```


## 新增环境变量说明
| 变量 | 作用 |
| ---- | ---- |
| `OPENAI_API_KEY` | OpenAI 调用凭证 |
| `AZURE_SPEECH_KEY` | Azure Speech 服务 Key |
| `AZURE_SPEECH_REGION` | Azure 区域（eastasia 等） |
| `KEY`/`SECRET` | Directus JWT & 加密密钥 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Directus 初始管理员 |

---

> **开发环境仍使用 Vercel**：`npx vercel` → 预览，`npx vercel --prod` → 生产（测试域名）。两者与 Docker 生产环境互不干扰，只需在 `.env` 或 Vercel Dashboard 配置对应的 API 地址即可。 
