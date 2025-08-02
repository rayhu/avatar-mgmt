# 🚀 快速部署指南

## 📋 **一键部署**

### **完整部署流程**
```bash
# 1. 构建所有组件
./scripts/deploy/main.sh build --all

# 2. 部署到服务器
./scripts/deploy/main.sh deploy --full

# 3. 配置JC21（手动）
# 访问: http://daidai.amis.hk:81
# 登录: admin@example.com / changeme
# 配置路径代理

# 4. 测试部署
./scripts/deploy/main.sh test
```

## 🔧 **JC21配置**

### **路径代理设置**
在JC21管理界面中配置以下路径代理：

| 路径 | 转发到 | 说明 |
|------|--------|------|
| `/api/` | `api:3000` | API服务 |
| `/directus/` | `directus:8055` | Directus CMS |
| `/` | `frontend:80` | 前端应用 |

### **高级配置示例**
```nginx
location /api/ {
    proxy_pass http://api:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🌐 **访问地址**

- **前端应用**: https://daidai.amis.hk
- **API服务**: https://daidai.amis.hk/api/health
- **Directus管理**: https://daidai.amis.hk/directus
- **JC21管理**: http://daidai.amis.hk:81

## 🛠️ **常用命令**

```bash
# 查看帮助
./scripts/deploy/main.sh --help

# 查看服务状态
./scripts/deploy/main.sh status

# 查看日志
./scripts/deploy/main.sh logs

# 重启服务
./scripts/deploy/main.sh deploy --restart

# 备份数据
./scripts/deploy/main.sh backup
```

## ⚡ **故障排除**

### **快速修复**
```bash
# 重置JC21配置
./scripts/deploy/main.sh config --reset

# 重新部署
./scripts/deploy/main.sh deploy --full

# 检查服务状态
./scripts/deploy/main.sh status
```

### **常见问题**
1. **JC21登录失败** → 使用默认凭据: admin@example.com / changeme
2. **API无法访问** → 检查路径代理配置中的斜杠
3. **前端构建失败** → 清理node_modules重新安装

---

**使用模块化部署系统，部署更加简单可靠！** 🚀 
