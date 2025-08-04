# API Server 文档

该服务是数字人管理系统的 **Backend-for-Frontend (BFF)**，定位介于 Directus CMS 与前端 Vue 应用之间。

## 📍 **当前生产环境**

- **域名**: `api.daidai.amis.hk`
- **内部地址**: `api:3000` (Docker内部网络)
- **健康检查**: `https://api.daidai.amis.hk/health`

## 🎯 **主要职责**

1. **🔐 凭据隔离**
   - 持有 `OPENAI_API_KEY`、`AZURE_SPEECH_KEY` 等敏感环境变量，防止泄露到浏览器
2. **🔄 业务聚合**
   - `/api/openai-ssml`：构造 Prompt → 调用 OpenAI → 清洗/返回 SSML
   - `/api/avatars`：读取 Directus `avatars` 集合，返回模型数据
   - `/api/avatars/:id` (PUT/PATCH)：模型版本和状态管理
3. **🌐 统一网关**
   - 前端只需调用 `api.daidai.amis.hk`，无需关心后端服务拆分或 URL 变化
4. **⚡ 性能优化**
   - 日志记录和错误追踪
   - 可扩展 Redis/LRU 缓存以减少外部 API 频率

## 🔌 **API 端点**

### **核心端点**
```
GET  /health                    # 健康检查
GET  /api/avatars              # 获取模型列表
PUT  /api/avatars/:id          # 更新模型状态和版本  
PATCH /api/avatars/:id         # 部分更新模型信息
POST /api/openai-ssml          # OpenAI SSML 生成
POST /api/azure-tts            # Azure TTS 语音合成
POST /api/generate-ssml        # 高级 SSML 生成
```

## 端口 & 路由

| 环境          | 入口 URL                    | 说明                     |
|---------------|-----------------------------|--------------------------|
| 本地开发       | `http://localhost:3000`      | `yarn workspace api-server start` 或扩展 `docker-compose.dev.yml` |
| 生产容器内部   | `http://api:3000`            | 由 `docker-compose.prod.yml` 定义的服务名 `api` |
| 生产对外       | `https://<domain>/api/*`     | 通过 Nginx 反向代理      |

## 本地开发快速启动

```bash
# 启动 Directus & Postgres
docker compose -f docker-compose.dev.yml up -d db directus

# 启动 api-server（热重载）
cd api-server
yarn install
yarn dev   # tsx --watch index.ts

# 前端设置
cd ../frontend
echo "VITE_API_URL=http://localhost:3000" > .env.local
yarn dev
```

## 生产部署参考

生产环境已由 `docker-compose.prod.yml` 自动构建：

```yaml
api:
  build:
    context: .
    dockerfile: api-server/Dockerfile
  restart: always
  env_file:
    - .env
  expose:
    - "3000"
  networks:
    - internal
```

通过内部网络连接 Postgres/Directus，外部流量由 Nginx 统一代理到 `/api/`。 
