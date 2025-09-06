/**
 * Express 服务器配置 - Unity WebGL + Vue 应用
 * 支持压缩、MIME 类型、安全头和跨域设置
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============== 基础中间件配置 ==============

// 信任代理（如果在反向代理后面）
app.set('trust proxy', 1);

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 1000, // 限制每个 IP 1000 次请求
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ============== Unity WebGL 专用中间件 ==============

// Unity WebGL 文件的自定义压缩处理
function unityCompressionHandler(req, res, next) {
  const url = req.url;
  
  // Unity WebGL 构建文件已经压缩，设置正确的头部
  if (url.endsWith('.unityweb')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Encoding', 'br');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.endsWith('.wasm.unityweb')) {
    res.setHeader('Content-Type', 'application/wasm');
    res.setHeader('Content-Encoding', 'br');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.includes('unity_sample') && url.endsWith('.js.unityweb')) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Encoding', 'br');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.includes('unity_sample') && url.endsWith('.data.unityweb')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Encoding', 'br');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  next();
}

// Unity WebGL 安全头中间件
function unitySecurityHeaders(req, res, next) {
  if (req.url.includes('/unity_sample/')) {
    // Unity WebGL 需要的特殊头部
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // 允许在 iframe 中使用（仅限同源）
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  next();
}

// ============== 安全配置 ==============

// Helmet 安全头（需要为 Unity WebGL 定制）
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Unity WebGL 需要
        "'unsafe-eval'",   // Unity WebGL 需要
        "blob:"
      ],
      workerSrc: ["'self'", "blob:"],
      connectSrc: [
        "'self'",
        "ws:",
        "wss:",
        "https://api.daidai.amis.hk",
        NODE_ENV === 'development' ? 'http://localhost:*' : ''
      ].filter(Boolean),
      imgSrc: ["'self'", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'self'"],
      childSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // 我们手动处理
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名
    const allowedOrigins = [
      'https://daidai.amis.hk',
      'https://api.daidai.amis.hk',
      NODE_ENV === 'development' ? 'http://localhost:5173' : null,
      NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// ============== 应用中间件 ==============

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 应用 Unity 专用中间件
app.use(unityCompressionHandler);
app.use(unitySecurityHeaders);

// 动态压缩（排除已压缩的 Unity 文件）
app.use(compression({
  filter: (req, res) => {
    // 跳过已经压缩的 Unity WebGL 文件
    if (req.url.endsWith('.unityweb')) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// ============== 静态文件服务 ==============

// Unity WebGL 构建文件服务
app.use('/unity_sample', express.static(path.join(__dirname, '../frontend/public/unity_sample'), {
  maxAge: NODE_ENV === 'production' ? '1y' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // 为 Unity WebGL HTML 文件设置较短缓存
    if (path.extname(filePath) === '.html') {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时
    }
  }
}));

// Vue 应用静态文件服务
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  maxAge: NODE_ENV === 'production' ? '1y' : '1h',
  etag: true,
  lastModified: true,
  index: false // 不自动服务 index.html，由路由处理
}));

// ============== API 路由 ==============

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// 数字人 API 路由
app.use('/api', require('./routes/avatar-api')); // 假设你有这个路由文件

// Unity WebGL 特定的 API
app.get('/api/unity/config/:avatarId', (req, res) => {
  const { avatarId } = req.params;
  
  // 返回数字人配置
  res.json({
    avatarId,
    unityPath: `/unity_sample/index.html?avatarId=${avatarId}`,
    settings: {
      quality: 'high',
      enableAudio: true,
      enablePostMessage: true
    }
  });
});

// ============== Vue 路由处理（SPA 回退）==============

// 处理 Vue 路由 - 必须在所有其他路由之后
app.get('*', (req, res, next) => {
  // 如果请求的是 Unity WebGL 相关路径，跳过 SPA 处理
  if (req.url.startsWith('/unity_sample/') || 
      req.url.startsWith('/api/') ||
      req.url.startsWith('/health')) {
    return next();
  }
  
  // 服务 Vue 应用的 index.html
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// ============== 错误处理 ==============

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // CORS 错误
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed'
    });
  }
  
  // 其他错误
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============== 服务器启动 ==============

const server = app.listen(PORT, () => {
  console.log(`
🚀 服务器启动成功!
   端口: ${PORT}
   环境: ${NODE_ENV}
   时间: ${new Date().toISOString()}
   
🌐 访问地址:
   主应用: http://localhost:${PORT}
   Unity WebGL: http://localhost:${PORT}/unity_sample/
   健康检查: http://localhost:${PORT}/health
   API: http://localhost:${PORT}/api
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

module.exports = app;