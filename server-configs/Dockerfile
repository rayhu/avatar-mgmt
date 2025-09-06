# Unity WebGL + Vue 应用的多阶段 Docker 构建

# ============== 构建阶段 ==============
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY yarn.lock* ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 如果有前端构建步骤，在这里执行
# RUN npm run build:frontend

# ============== 生产阶段 ==============
FROM node:18-alpine AS production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 安装生产环境系统依赖
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 从构建阶段复制文件
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --chown=nodejs:nodejs . .

# 创建必要的目录
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node health-check.js || exit 1

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 作为 PID 1 进程
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "express-unity-server.js"]

# ============== 开发阶段 ==============
FROM node:18-alpine AS development

# 设置工作目录
WORKDIR /app

# 安装开发依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 复制 package 文件
COPY package*.json ./
COPY yarn.lock* ./

# 安装所有依赖（包括开发依赖）
RUN npm ci && npm cache clean --force

# 全局安装开发工具
RUN npm install -g nodemon pm2

# 复制应用代码
COPY . .

# 设置环境变量
ENV NODE_ENV=development
ENV PORT=3000
ENV LOG_LEVEL=debug

# 暴露端口
EXPOSE 3000
EXPOSE 9229

# 开发模式启动命令
CMD ["npm", "run", "dev"]