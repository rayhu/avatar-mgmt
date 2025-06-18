# api-server

该服务是数字人管理系统的 **Backend-for-Frontend (BFF)**，定位介于 Directus CMS 与前端 Vue 应用之间。

## 主要职责

1. **凭据隔离**
   - 持有 `OPENAI_API_KEY`、`AZURE_SPEECH_KEY` 等敏感环境变量，防止泄露到浏览器。
2. **业务聚合**
   - `/api/openai-ssml`：构造 Prompt → 调用 OpenAI → 清洗/返回 SSML。
   - `/api/models`：读取 Directus `models` 集合，过滤 `status = ready`。
3. **统一网关**
   - 前端只需调用 `/api/*`，无需关心后端服务拆分或 URL 变化。
4. **性能优化**
   - 可在内部加入 Redis / LRU 缓存以减少外部 API 频率。

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
