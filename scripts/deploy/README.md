# Avatar Management 部署系统

## 📋 **概述**

这是一个模块化的部署系统，将复杂的部署流程分解为独立的模块，便于维护和扩展。

## 🏗️ **架构设计**

### **模块化结构**
```
scripts/deploy/
├── main.sh              # 主入口脚本
├── modules/             # 功能模块
│   ├── common.sh        # 通用功能（日志、配置、错误处理）
│   ├── build.sh         # 构建模块（前端、API）
│   └── deploy.sh        # 部署模块（服务器部署）
└── README.md           # 说明文档
```

### **设计原则**
1. **单一职责** - 每个模块只负责一个功能
2. **可复用性** - 通用功能抽象到common模块
3. **错误处理** - 统一的错误处理和日志记录
4. **配置管理** - 环境变量和配置文件分离

## 🚀 **使用方法**

### **基本用法**
```bash
# 查看帮助
./scripts/deploy/main.sh --help

# 构建前端
./scripts/deploy/main.sh build --frontend

# 完整部署
./scripts/deploy/main.sh deploy --full

# 测试部署
./scripts/deploy/main.sh test
```

### **环境变量**
```bash
export SERVER_HOST="daidai-singapore"
export REMOTE_DIR="/opt/avatar-mgmt"
export DOMAIN="daidai.amis.hk"
```

## 📦 **模块说明**

### **1. Common Module (`common.sh`)**
- **功能**: 基础功能和配置
- **包含**: 日志函数、错误处理、SSH连接、文件同步
- **特点**: 被其他所有模块引用

### **2. Build Module (`build.sh`)**
- **功能**: 构建前端和API镜像
- **选项**:
  - `--frontend`: 只构建前端
  - `--api`: 只构建API镜像
  - `--all`: 构建所有组件

### **3. Deploy Module (`deploy.sh`)**
- **功能**: 服务器部署管理
- **选项**:
  - `--full`: 完整部署流程
  - `--sync`: 只同步代码
  - `--start`: 只启动服务
  - `--status`: 检查服务状态



## 🔧 **快速命令**

### **完整部署流程**
```bash
# 1. 构建所有组件
./scripts/deploy/main.sh build --all

# 2. 部署到服务器
./scripts/deploy/main.sh deploy --full

# 3. 测试部署
./scripts/deploy/main.sh test
```

### **日常维护**
```bash
# 查看服务状态
./scripts/deploy/main.sh status

# 查看日志
./scripts/deploy/main.sh logs

# 备份数据
./scripts/deploy/main.sh backup

# 重启服务
./scripts/deploy/main.sh deploy --restart
```

## 🛠️ **故障排除**

### **常见问题**

1. **SSH连接失败**
   ```bash
   # 检查SSH配置
   ssh daidai-singapore "echo 'test'"
   ```

2. **构建失败**
   ```bash
   # 检查Node.js版本
   node --version
   npm --version
   ```

3. **部署失败**
   ```bash
   # 检查Docker
   docker --version
   docker compose version
   ```



## 📈 **优势对比**

### **旧脚本问题**
- ❌ 功能混杂，难以维护
- ❌ 错误处理不统一
- ❌ 配置分散
- ❌ 难以扩展

### **新系统优势**
- ✅ **模块化设计** - 功能分离，易于维护
- ✅ **统一错误处理** - 一致的日志和错误处理
- ✅ **配置集中管理** - 环境变量统一管理
- ✅ **易于扩展** - 新功能只需添加新模块
- ✅ **可复用性** - 通用功能可被多个模块使用

## 🔄 **迁移指南**

### **从旧脚本迁移**
1. **备份现有脚本**
   ```bash
   cp scripts/deploy-to-singapore.sh scripts/deploy-to-singapore.sh.backup
   ```

2. **使用新系统**
   ```bash
   # 替换旧命令
   # 旧: ./scripts/deploy-to-singapore.sh --deploy  
# 新: ./scripts/deploy/main.sh deploy --full
   ```

3. **更新CI/CD**
   ```bash
   # 在CI/CD中使用新命令
   ./scripts/deploy/main.sh build --all
   ./scripts/deploy/main.sh deploy --full
   ```

## 🎯 **最佳实践**

1. **环境隔离** - 使用环境变量管理配置
2. **错误处理** - 所有操作都有错误处理
3. **日志记录** - 详细的操作日志
4. **模块复用** - 避免代码重复
5. **测试验证** - 部署后自动测试

## 📝 **扩展指南**

### **添加新模块**
1. 在`modules/`目录创建新脚本
2. 继承`common.sh`的功能
3. 在`main.sh`中添加模块入口
4. 更新文档

### **添加新功能**
1. 在相应模块中添加函数
2. 更新帮助信息
3. 添加错误处理
4. 测试功能

---

**这个新的部署系统提供了更好的可维护性、可扩展性和错误处理能力！** 🚀 



