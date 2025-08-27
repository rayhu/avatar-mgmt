# 云存储 + CDN + Signed URL 设置指南

## 🎯 概述

本指南将帮助你设置云存储和CDN来替代Directus文件代理，使用signed
URL来保护文件访问权限，同时提高文件分发速度。

## 🚀 优势

- **性能提升**: 文件直接从CDN分发，无需经过API服务器
- **权限控制**: 使用signed URL控制文件访问权限
- **成本优化**: 减少API服务器的带宽和计算负载
- **全球加速**: CDN提供全球节点加速
- **安全可靠**: 文件访问有有效期限制

## 🔧 设置步骤

### 1. 选择云存储提供商

推荐使用以下提供商（按推荐顺序）：

#### 阿里云OSS + CDN

- **优势**: 国内访问速度快，价格合理，文档完善
- **适用场景**: 主要用户在中国大陆
- **价格**: 存储约0.12元/GB/月，CDN约0.15元/GB

#### 腾讯云COS + CDN

- **优势**: 与腾讯生态集成好，香港节点多
- **适用场景**: 主要用户在香港/东南亚
- **价格**: 存储约0.1元/GB/月，CDN约0.12元/GB

#### AWS S3 + CloudFront

- **优势**: 全球覆盖，功能强大
- **适用场景**: 全球用户分布
- **价格**: 存储约0.023美元/GB/月，CDN约0.085美元/GB

### 2. 创建云存储资源

#### 阿里云OSS设置

1. **创建Bucket**

   ```bash
   # 登录阿里云控制台
   # 进入对象存储OSS服务
   # 创建Bucket，选择合适的地域（推荐：香港、新加坡）
   ```

2. **配置Bucket权限**

   ```json
   {
     "Version": "1",
     "Statement": [
       {
         "Effect": "Deny",
         "Principal": "*",
         "Action": "oss:*",
         "Resource": "arn:aws:oss:*:*:your-bucket/*",
         "Condition": {
           "StringNotEquals": {
             "aws:Referer": ["your-domain.com", "*.your-domain.com"]
           }
         }
       }
     ]
   }
   ```

3. **创建RAM用户和AccessKey**
   ```bash
   # 进入RAM访问控制
   # 创建用户，分配OSS权限
   # 生成AccessKey ID和Secret
   ```

#### 腾讯云COS设置

1. **创建Bucket**

   ```bash
   # 登录腾讯云控制台
   # 进入对象存储COS服务
   # 创建Bucket，选择合适的地域（推荐：香港、新加坡）
   ```

2. **配置Bucket权限**

   ```json
   {
     "Statement": [
       {
         "Effect": "Deny",
         "Principal": "*",
         "Action": "cos:*",
         "Resource": "qcs::cos:ap-hongkong:uid/your-bucket/*",
         "Condition": {
           "StringNotEquals": {
             "cos:Referer": ["your-domain.com", "*.your-domain.com"]
           }
         }
       }
     ]
   }
   ```

3. **创建API密钥**
   ```bash
   # 进入访问管理
   # 创建API密钥
   # 记录SecretId和SecretKey
   ```

### 3. 配置CDN

#### 阿里云CDN配置

1. **添加加速域名**

   ```bash
   # 进入CDN控制台
   # 添加加速域名：cdn.yourdomain.com
   # 源站类型选择：OSS域名
   # 源站地址：your-bucket.oss-region.aliyuncs.com
   ```

2. **配置HTTPS**

   ```bash
   # 配置SSL证书（推荐使用Let's Encrypt免费证书）
   # 开启强制HTTPS跳转
   # 配置HSTS
   ```

3. **优化配置**
   ```bash
   # 开启Gzip压缩
   # 配置缓存策略
   # 开启智能压缩
   ```

#### 腾讯云CDN配置

1. **添加加速域名**

   ```bash
   # 进入CDN控制台
   # 添加加速域名：cdn.yourdomain.com
   # 源站类型选择：COS域名
   # 源站地址：your-bucket.cos.region.myqcloud.com
   ```

2. **配置HTTPS**
   ```bash
   # 配置SSL证书
   # 开启强制HTTPS跳转
   # 配置HSTS
   ```

### 4. 环境变量配置

复制环境变量示例文件：

```bash
cp env.cloud-storage.example .env.cloud-storage
```

编辑 `.env.cloud-storage` 文件：

```env
# 阿里云OSS配置示例
CLOUD_STORAGE_PROVIDER=aliyun
CLOUD_STORAGE_REGION=oss-cn-hongkong
CLOUD_STORAGE_BUCKET=your-avatar-bucket
CLOUD_STORAGE_ACCESS_KEY_ID=your-access-key-id
CLOUD_STORAGE_ACCESS_KEY_SECRET=your-access-key-secret
CLOUD_STORAGE_ENDPOINT=https://oss-cn-hongkong.aliyuncs.com
CLOUD_STORAGE_CDN_DOMAIN=cdn.yourdomain.com
CLOUD_STORAGE_ENABLED=true
CLOUD_STORAGE_CDN_ENABLED=true
```

### 5. 安装依赖

```bash
cd api-server
yarn add crypto
```

### 6. 测试配置

启动API服务器并测试：

```bash
# 测试signed URL生成
curl "http://localhost:3000/api/cloud-storage/signed-url/test-file-id?expiresIn=3600"

# 测试文件上传
curl -X POST "http://localhost:3000/api/cloud-storage/upload" \
  -H "Authorization: Bearer your-token" \
  -F "file=@test-file.jpg" \
  -F "category=avatars"
```

## 📱 前端使用

### 1. 使用组件

```vue
<template>
  <CloudStorageFileViewer
    file-id="your-file-id"
    file-name="avatar.glb"
    file-size="2048576"
    mime-type="model/gltf-binary"
    :expires-in="3600"
    :auto-refresh="true"
  />
</template>

<script setup>
import CloudStorageFileViewer from '@/components/CloudStorageFileViewer.vue';
</script>
```

### 2. 直接调用API

```typescript
// 生成signed URL
const generateSignedUrl = async (fileId: string) => {
  const response = await fetch(`/api/cloud-storage/signed-url/${fileId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data.signedUrl;
};

// 使用signed URL
const signedUrl = await generateSignedUrl('file-id-123');
const img = document.createElement('img');
img.src = signedUrl;
```

## 🔒 安全考虑

### 1. 权限控制

- **文件级权限**: 检查用户是否有权限访问特定文件
- **时间限制**: signed URL有过期时间，防止长期访问
- **来源限制**: 限制Referer，防止盗链

### 2. 监控和日志

```typescript
// 记录文件访问日志
Logger.info('File accessed via signed URL', {
  fileId,
  userId,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
});
```

### 3. 异常处理

```typescript
// 检测异常访问模式
if (accessCount > threshold) {
  Logger.warn('Suspicious file access pattern detected', {
    fileId,
    userId,
    accessCount,
    timeWindow,
  });

  // 可以临时禁用该文件的signed URL生成
  await disableFileAccess(fileId, duration);
}
```

## 📊 性能优化

### 1. CDN配置优化

```bash
# 缓存策略
# 图片文件：缓存1年
# 3D模型：缓存1个月
# 音频文件：缓存1周

# 压缩配置
# 开启Gzip/Brotli压缩
# 图片自动优化（WebP转换）
# 智能压缩
```

### 2. 缓存策略

```typescript
// 客户端缓存
res.set({
  'Cache-Control': 'public, max-age=31536000', // 1年
  ETag: fileHash,
  'Last-Modified': fileModifiedTime,
});

// 服务端缓存
const cacheKey = `signed-url:${fileId}:${expiresIn}`;
const cachedUrl = await redis.get(cacheKey);
if (cachedUrl) {
  return cachedUrl;
}
```

### 3. 批量操作

```typescript
// 批量生成signed URL
const batchGenerateSignedUrls = async (fileIds: string[]) => {
  const promises = fileIds.map(id => generateSignedUrl(id));
  return Promise.all(promises);
};
```

## 🚨 故障排除

### 1. 常见问题

#### Signed URL生成失败

```bash
# 检查环境变量
echo $CLOUD_STORAGE_PROVIDER
echo $CLOUD_STORAGE_ACCESS_KEY_ID

# 检查网络连接
curl -I https://oss-cn-hongkong.aliyuncs.com
```

#### CDN访问慢

```bash
# 检查CDN配置
# 验证源站设置
# 检查缓存策略
# 查看CDN监控数据
```

#### 权限错误

```bash
# 检查AccessKey权限
# 验证Bucket策略
# 检查Referer设置
```

### 2. 监控指标

- **响应时间**: signed URL生成时间
- **成功率**: 文件访问成功率
- **带宽使用**: CDN带宽消耗
- **错误率**: 各种错误的发生频率

### 3. 告警设置

```typescript
// 设置告警阈值
const ALERT_THRESHOLDS = {
  signedUrlGenerationTime: 1000, // 1秒
  errorRate: 0.05, // 5%
  responseTime: 2000, // 2秒
};

// 监控和告警
if (generationTime > ALERT_THRESHOLDS.signedUrlGenerationTime) {
  await sendAlert('Signed URL generation slow', {
    fileId,
    generationTime,
    threshold: ALERT_THRESHOLDS.signedUrlGenerationTime,
  });
}
```

## 📈 成本优化

### 1. 存储优化

- **生命周期管理**: 自动删除过期文件
- **存储类型**: 根据访问频率选择存储类型
- **压缩**: 启用文件压缩减少存储空间

### 2. CDN优化

- **缓存策略**: 合理设置缓存时间
- **压缩**: 启用Gzip/Brotli压缩
- **边缘计算**: 利用CDN边缘节点处理

### 3. 监控成本

```bash
# 设置成本告警
# 监控存储使用量
# 跟踪CDN流量
# 定期审查访问日志
```

## 🔄 迁移策略

### 1. 渐进式迁移

1. **第一阶段**: 新文件使用云存储
2. **第二阶段**: 迁移热门文件
3. **第三阶段**: 迁移所有文件

### 2. 回滚方案

```typescript
// 保留原有的Directus代理作为后备
const getFileUrl = async (fileId: string) => {
  try {
    // 优先使用云存储
    return await generateSignedUrl(fileId);
  } catch (error) {
    // 回退到Directus代理
    Logger.warn('Falling back to Directus proxy', { fileId, error });
    return `/api/assets/${fileId}`;
  }
};
```

### 3. 数据一致性

```typescript
// 同步文件元数据
const syncFileMetadata = async () => {
  const directusFiles = await getDirectusFiles();
  const cloudFiles = await getCloudStorageFiles();

  // 比较并同步差异
  const differences = compareFileLists(directusFiles, cloudFiles);
  await applyDifferences(differences);
};
```

## 📚 参考资料

- [阿里云OSS文档](https://help.aliyun.com/product/31815.html)
- [腾讯云COS文档](https://cloud.tencent.com/document/product/436)
- [AWS S3文档](https://docs.aws.amazon.com/s3/)
- [CDN最佳实践](https://developer.mozilla.org/en-US/docs/Web/Performance/CDN)

## 🆘 获取帮助

如果遇到问题，可以：

1. 查看API服务器日志
2. 检查云存储控制台
3. 验证网络连接
4. 联系云存储技术支持
5. 在项目Issues中提问

---

**注意**: 在生产环境中使用前，请确保充分测试所有功能，并设置适当的监控和告警。
