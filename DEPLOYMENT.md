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