# 小声BB (Small_BB)

<p align="center">
  <strong>🔒 基于私钥的加密即时通讯系统</strong>
</p>

<p align="center">
  <em>"小声BB" — 只有持有正确私钥的人，才能听懂你在说什么。</em>
</p>

<p align="center">
  <a href="#快速开始"><strong>快速开始</strong></a> ·
  <a href="#功能特性"><strong>功能特性</strong></a> ·
  <a href="#安装部署"><strong>安装部署</strong></a> ·
  <a href="#配置说明"><strong>配置说明</strong></a> ·
  <a href="#API文档"><strong>API 文档</strong></a> ·
  <a href="#故障排除"><strong>故障排除</strong></a>
</p>

---

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [环境准备](#环境准备)
- [安装部署](#安装部署)
- [配置说明](#配置说明)
- [构建步骤](#构建步骤)
- [启动命令](#启动命令)
- [API 文档](#api-文档)
- [项目结构](#项目结构)
- [安全设计](#安全设计)
- [故障排除](#故障排除)
- [开发指南](#开发指南)
- [许可证](#许可证)

---

## 项目简介

小声BB（Small_BB）是一个基于 **NodeBB** 论坛平台的加密即时通讯插件。它实现了基于房间（Room）的私钥加密机制，确保消息内容仅对持有正确私钥的用户可见。当用户未持有对应私钥或私钥验证失败时，所有消息内容将自动转换为由"哈基米"文本构成的乱码形式。

### 核心设计理念

- **房间隔离**：每个聊天房间拥有独立的加密私钥，房间之间完全隔离
- **客户端加密**：所有加密操作在浏览器端完成，服务器永不接触明文
- **零信任架构**：服务器仅存储密文，即使服务器被攻破也无法解密消息
- **像素风格 UI**：复古终端风格的像素化界面，致敬经典加密通讯终端

### 适用场景

- 需要端到端加密的团队内部通讯
- 敏感信息的安全讨论与传输
- 需要房间级别访问控制的私密群组
- 对隐私保护有高要求的即时通讯场景

---

## 功能特性

### 核心功能

| 功能 | 描述 |
|------|------|
| 🔐 **房间私钥管理** | 每个房间拥有独立的加密私钥，支持创建、验证、轮换和撤销 |
| 📝 **消息加密传输** | 基于 AES-256-GCM 的客户端加密，消息在发送前即被加密 |
| 🔑 **PBKDF2 密钥派生** | 使用 100,000 次迭代的 PBKDF2 算法派生加密密钥 |
| 🔤 **Base-N 编码** | 支持自定义字典的 Base-N 编码，将二进制密文转换为可读文本 |
| 🎭 **哈基米乱码** | 私钥错误时自动显示"哈基米"乱码，保护消息内容不被窥探 |
| 👥 **用户认证** | 集成 NodeBB 用户系统，支持注册、登录和会话管理 |
| 💬 **公共聊天区** | 房间内的公共聊天区域，所有消息自动加密 |
| 📱 **响应式设计** | 适配桌面端和移动端，像素风格 UI 在不同设备上完美呈现 |
| 📋 **审计日志** | 完整的操作审计记录，包括密钥变更、房间操作等 |

### 加密算法

| 组件 | 算法 | 参数 |
|------|------|------|
| 对称加密 | AES-256-GCM | 256 位密钥，12 字节 IV，16 字节认证标签 |
| 密钥派生 | PBKDF2 | 100,000 次迭代，SHA-256 哈希 |
| 编码方案 | Base-N | 支持自定义字典（默认"哈基米"） |
| 随机数生成 | crypto.randomBytes | 16 字节盐值，12 字节 IV |

---

## 技术架构

```
┌──────────────────────────────────────────────────────────┐
│                    浏览器客户端                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ 像素 UI  │  │ Web Crypto│  │ Socket.IO 实时通信   │   │
│  │ (CSS)   │  │ API 加密  │  │ (消息推送)           │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  NodeBB 应用服务器                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ 用户认证  │  │ 路由处理  │  │ 小声BB 插件          │   │
│  │(Passport)│  │(Express) │  │ (加密/解密/房间管理)  │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                      数据存储层                            │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │    MongoDB        │    │        Redis              │   │
│  │ (用户/房间/消息)   │    │ (会话/缓存/在线状态)      │   │
│  └──────────────────┘    └──────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本要求 |
|------|------|----------|
| 运行时 | Node.js | >= 16.0.0 |
| 论坛平台 | NodeBB | >= 2.0.0 |
| 数据库 | MongoDB | >= 5.0 |
| 缓存 | Redis | >= 6.0 |
| 前端加密 | Web Crypto API | 浏览器内置 |
| 实时通信 | Socket.IO | NodeBB 内置 |

---

## 快速开始

如果你只想快速体验加密功能，无需安装 NodeBB，直接使用独立测试页面：

```bash
git clone https://github.com/your-org/small-bb.git
cd small-bb
npx http-server -p 8080 -c-1
```

然后在浏览器中打开 `http://localhost:8080/test-standalone.html`。

### 快速测试步骤

1. 在"通讯协议"区域点击 **生成随机私钥** 按钮
2. 在"加密隐写"区域输入任意文本，点击 **生成密文**
3. 复制生成的密文，粘贴到"解密还原"区域
4. 点击 **还原明文**，验证解密结果
5. 修改私钥后再次解密，观察"哈基米"乱码效果

---

## 环境准备

### 操作系统兼容性

| 操作系统 | 最低版本 | 推荐版本 | 架构支持 |
|----------|----------|----------|----------|
| **Windows** | Windows 10 (Build 1809+) | Windows 11 | x64, ARM64 |
| **macOS** | macOS 11 (Big Sur) | macOS 14 (Sonoma) | x64, ARM64 (Apple Silicon) |
| **Ubuntu** | 20.04 LTS | 22.04 LTS / 24.04 LTS | x64, ARM64 |
| **Debian** | 11 (Bullseye) | 12 (Bookworm) | x64, ARM64 |
| **CentOS/RHEL** | 8.x | 9.x | x64 |
| **Fedora** | 36 | 40+ | x64 |
| **Arch Linux** | 滚动更新 | 最新滚动更新 | x64 |

> **注意**：Windows 用户建议使用 **PowerShell 7+** 或 **Windows Terminal** 执行命令。Git Bash 和 WSL2 也是完全兼容的选择。

### 必需软件

#### 1. Node.js

| 项目 | 要求 |
|------|------|
| **最低版本** | Node.js 16.0.0 |
| **推荐版本** | Node.js 18.x LTS 或 20.x LTS |
| **不支持版本** | Node.js 14.x 及以下（缺少 Web Crypto API 完整支持） |

**安装方式**：

```bash
# 方式一：使用 nvm（推荐，支持多版本管理）
# Windows: https://github.com/coreybutler/nvm-windows
nvm install 18
nvm use 18

# macOS / Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
nvm use 18

# 方式二：使用 fnm（更快的 Node.js 版本管理器）
# Windows (PowerShell):
winget install Schniz.fnm
fnm install 18
fnm use 18

# macOS / Linux:
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 18
fnm use 18

# 方式三：直接下载安装包
# 访问 https://nodejs.org/ 下载 LTS 版本安装包
```

**验证安装**：

```bash
node --version
# 预期输出: v18.x.x 或 v20.x.x

npm --version
# 预期输出: 9.x.x 或 10.x.x
```

#### 2. MongoDB

| 项目 | 要求 |
|------|------|
| **最低版本** | MongoDB 5.0 |
| **推荐版本** | MongoDB 7.0 |
| **存储引擎** | WiredTiger |

**安装方式**：

```bash
# Windows: 下载 MSI 安装包
# https://www.mongodb.com/try/download/community

# macOS (Homebrew):
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Ubuntu 22.04:
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Docker（推荐用于开发环境）:
docker run -d --name mongodb -p 27017:27017 mongo:7.0
```

**验证安装**：

```bash
mongosh --version
# 预期输出: 2.x.x

# 测试连接:
mongosh --eval "db.runCommand({ ping: 1 })"
# 预期输出: { ok: 1 }
```

#### 3. Redis

| 项目 | 要求 |
|------|------|
| **最低版本** | Redis 6.0 |
| **推荐版本** | Redis 7.2 |

**安装方式**：

```bash
# Windows: 使用 WSL2 或 Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# macOS (Homebrew):
brew install redis
brew services start redis

# Ubuntu 22.04:
sudo apt-get install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Docker:
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**验证安装**：

```bash
redis-cli ping
# 预期输出: PONG
```

#### 4. Git

| 项目 | 要求 |
|------|------|
| **最低版本** | Git 2.30 |
| **推荐版本** | Git 2.44+ |

```bash
# Windows: https://git-scm.com/download/win
# macOS: brew install git
# Ubuntu: sudo apt-get install -y git

git --version
# 预期输出: git version 2.x.x
```

#### 5. 其他可选工具

| 工具 | 用途 | 安装命令 |
|------|------|----------|
| **Python 3** | 独立测试 HTTP 服务器 | `python --version` |
| **http-server** | Node.js 静态服务器 | `npm install -g http-server` |
| **pm2** | 生产环境进程管理 | `npm install -g pm2` |

---

## 安装部署

### 部署流程图

```
环境准备 → 安装 NodeBB → 安装小声BB插件 → 配置数据库 → 启动服务 → 激活插件 → 验证部署
```

### 步骤一：安装 NodeBB

如果你还没有 NodeBB 实例，请先安装：

```bash
# 1. 克隆 NodeBB
git clone -b v3.x https://github.com/NodeBB/NodeBB.git nodebb
cd nodebb

# 2. 安装 NodeBB 依赖
npm install

# 3. 启动 NodeBB 安装向导
./nodebb setup

# 安装向导会引导你配置:
# - 数据库连接 (MongoDB URL)
# - Redis 连接
# - 管理员账户
# - 站点基本信息
```

> **详细 NodeBB 安装文档**：https://docs.nodebb.org/installing/os/

### 步骤二：安装小声BB插件

#### 方式一：从本地目录安装（开发模式，推荐）

```bash
# 1. 克隆小声BB项目
git clone https://github.com/your-org/small-bb.git
# 项目将位于当前目录的 small-bb 文件夹中

# 2. 进入 NodeBB 根目录
cd nodebb

# 3. 将小声BB插件复制到 node_modules
# Windows (PowerShell):
Copy-Item -Path "..\small-bb\*" -Destination ".\node_modules\small-bb\" -Recurse -Force

# Windows (CMD):
xcopy /E /I "..\small-bb" ".\node_modules\small-bb"

# macOS / Linux:
cp -r ../small-bb ./node_modules/small-bb

# 4. 确保插件目录结构正确
# 检查以下文件是否存在:
ls ./node_modules/small-bb/plugin.json
ls ./node_modules/small-bb/library.js
ls ./node_modules/small-bb/package.json
```

#### 方式二：使用 npm link（开发模式）

```bash
# 1. 在 small-bb 项目目录中创建全局链接
cd small-bb
npm link

# 2. 在 NodeBB 目录中链接插件
cd ../nodebb
npm link small-bb

# 3. 验证链接
ls ./node_modules/small-bb
```

#### 方式三：从 npm 安装（生产模式）

```bash
cd nodebb
npm install small-bb
```

### 步骤三：激活插件

```bash
# 在 NodeBB 根目录执行:

# 1. 构建并重启 NodeBB
./nodebb build
./nodebb restart

# 2. 通过管理后台激活插件:
#    浏览器访问: http://your-domain.com/admin
#    导航到: 插件 (Plugins) → 已安装 (Installed)
#    找到 "小声BB加密通讯终端" → 点击 "激活 (Activate)"
#    系统会自动重建并重启
```

### 步骤四：验证部署

```bash
# 1. 检查 NodeBB 是否正常运行
curl http://localhost:4567
# 预期: 返回 NodeBB 首页 HTML

# 2. 访问小声BB页面
# 浏览器打开: http://localhost:4567/small-bb
# 预期: 看到像素风格的加密通讯终端界面

# 3. 测试 API 端点
curl http://localhost:4567/small-bb/api/room-key/generate
# 预期: 返回 JSON 格式的随机房间密钥
```

---

## 配置说明

### 配置文件概览

| 文件 | 格式 | 用途 | 必需 |
|------|------|------|------|
| `plugin.json` | JSON | NodeBB 插件注册配置 | ✅ |
| `package.json` | JSON | npm 包配置和依赖声明 | ✅ |
| `config.json` (NodeBB) | JSON | NodeBB 主配置文件 | ✅ |

### plugin.json 配置详解

```json
{
    "id": "small-bb",
    "name": "小声BB加密通讯终端",
    "description": "基于私钥的加密即时通讯系统，支持房间管理和消息加密",
    "version": "2.0.0",
    "library": "./library.js",
    "templates": "./templates",
    "staticDirs": {
        "assets": "./public/assets"
    },
    "hooks": [
        { "hook": "static:app.load", "method": "init" },
        { "hook": "filter:admin.header.build", "method": "addAdminNavigation" }
    ],
    "compatibility": "^2.0.0 || ^3.0.0"
}
```

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `id` | String | 插件唯一标识符，必须与目录名一致 |
| `name` | String | 插件显示名称 |
| `version` | String | 语义化版本号 (SemVer) |
| `library` | String | 插件入口文件路径 |
| `templates` | String | 模板文件目录路径 |
| `staticDirs` | Object | 静态资源目录映射 |
| `hooks` | Array | 插件钩子注册列表 |
| `compatibility` | String | NodeBB 版本兼容范围 |

### package.json 配置详解

```json
{
    "name": "small-bb",
    "version": "2.0.0",
    "main": "library.js",
    "peerDependencies": {
        "nodebb": "^2.0.0 || ^3.0.0"
    },
    "engines": {
        "node": ">=16.0.0"
    }
}
```

| 配置项 | 说明 |
|--------|------|
| `peerDependencies.nodebb` | 声明对 NodeBB 的版本依赖 |
| `engines.node` | 声明对 Node.js 的版本要求 |

### NodeBB 环境变量

在 NodeBB 根目录创建或编辑 `.env` 文件（如果使用）：

```bash
# NodeBB 环境变量（可选）
NODE_ENV=production
NODEBB_PORT=4567
NODEBB_URL=http://localhost:4567

# 数据库连接（通常在 config.json 中配置）
MONGODB_URI=mongodb://localhost:27017/nodebb
REDIS_URI=redis://localhost:6379
```

### 环境切换

| 环境 | NODE_ENV | 特点 |
|------|----------|------|
| **开发** | `development` | 详细日志，热重载，调试模式 |
| **测试** | `test` | 隔离数据库，模拟服务 |
| **生产** | `production` | 压缩资源，最小日志，性能优化 |

```bash
# 开发环境启动
NODE_ENV=development ./nodebb start

# 生产环境启动
NODE_ENV=production ./nodebb start
```

---

## 构建步骤

### 完整构建流程

```bash
# 1. 进入 NodeBB 根目录
cd nodebb

# 2. 安装/更新依赖
npm install

# 3. 代码质量检查（如果配置了 ESLint）
# cd node_modules/small-bb && npm run lint

# 4. 构建前端资源
./nodebb build

# 5. 启动服务
./nodebb start
```

### 各步骤详细说明

#### 步骤 1：依赖安装

```bash
# 安装 NodeBB 依赖
npm install

# 验证依赖完整性
npm ls --depth=0
```

**预期输出**：列出所有已安装的顶层依赖包及其版本。

#### 步骤 2：代码质量检查

```bash
# 进入插件目录
cd node_modules/small-bb

# 运行 ESLint 检查
npx eslint .

# 预期输出: 无错误或仅有警告
```

#### 步骤 3：构建前端资源

```bash
./nodebb build
```

**构建过程包括**：
- 编译客户端 JavaScript
- 打包 CSS 样式文件
- 处理静态资源（图片、字体）
- 生成模板缓存
- 更新语言文件

**预期输出**：
```
[build] Building...
[build] Webpack compilation complete
[build] Build complete
```

#### 步骤 4：启动服务

```bash
./nodebb start
```

**预期输出**：
```
[cluster] Child process (PID) started
[app] NodeBB is now listening on: 0.0.0.0:4567
```

---

## 启动命令

### 开发环境

```bash
# 启动 NodeBB（开发模式，带详细日志）
./nodebb start --log-level=verbose

# 或者使用 dev 模式（自动重启）
./nodebb dev

# 查看实时日志
./nodebb log
```

### 测试环境

```bash
# 使用测试配置文件启动
./nodebb start --config=test.json

# 运行测试套件
npm test
```

### 生产环境

```bash
# 方式一：直接启动
NODE_ENV=production ./nodebb start

# 方式二：使用 pm2 进程管理（推荐）
npm install -g pm2
pm2 start app.js --name "nodebb" -- --production
pm2 save
pm2 startup

# 方式三：使用 systemd（Linux）
sudo systemctl start nodebb
sudo systemctl enable nodebb
```

### 服务管理命令

```bash
# 启动服务
./nodebb start

# 停止服务
./nodebb stop

# 重启服务
./nodebb restart

# 重新加载（不中断服务）
./nodebb reload

# 查看服务状态
./nodebb status

# 查看实时日志
./nodebb log

# 升级 NodeBB
./nodebb upgrade
```

### 数据库初始化

NodeBB 首次启动时会自动创建所需的数据库集合和索引，无需手动执行初始化脚本。

如果需要手动重建索引：

```bash
# 进入 MongoDB Shell
mongosh

# 切换到 NodeBB 数据库
use nodebb

# 重建索引
db.objects.reIndex()
db.search.reIndex()
```

### 验证服务运行状态

```bash
# 1. 检查进程
ps aux | grep nodebb    # Linux/macOS
tasklist | findstr node  # Windows

# 2. 检查端口监听
netstat -an | grep 4567    # Linux/macOS
netstat -an | findstr 4567  # Windows

# 3. HTTP 健康检查
curl -I http://localhost:4567
# 预期: HTTP/1.1 200 OK

# 4. 访问管理后台
# 浏览器打开: http://localhost:4567/admin
```

---

## API 文档

小声BB插件提供以下 REST API 端点：

### 加密接口

#### POST `/small-bb/api/encrypt`

加密明文消息。

**请求体**：

```json
{
    "plaintext": "你好，这是秘密消息",
    "password": "my-secret-key-2024",
    "alphabet": "哈基米"
}
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `plaintext` | String | ✅ | 待加密的明文 |
| `password` | String | ✅ | 加密私钥 |
| `alphabet` | String | ❌ | Base-N 字典（默认"哈基米"） |

**成功响应** (200)：

```json
{
    "success": true,
    "data": {
        "ciphertext": "基米哈哈基米哈基...",
        "alphabet": "哈基米",
        "encrypted": true
    }
}
```

**错误响应** (400)：

```json
{
    "success": false,
    "error": "缺少必要参数：plaintext 和 password"
}
```

---

#### POST `/small-bb/api/decrypt`

解密密文消息。

**请求体**：

```json
{
    "ciphertext": "基米哈哈基米哈基...",
    "password": "my-secret-key-2024",
    "alphabet": "哈基米"
}
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `ciphertext` | String | ✅ | Base-N 编码的密文 |
| `password` | String | ✅ | 解密私钥 |
| `alphabet` | String | ❌ | Base-N 字典（默认"哈基米"） |

**成功响应** (200)：

```json
{
    "success": true,
    "data": {
        "plaintext": "你好，这是秘密消息",
        "decrypted": true
    }
}
```

**错误响应** (500)：

```json
{
    "success": false,
    "error": "解密失败：私钥错误或密文已损坏"
}
```

---

### 房间密钥接口

#### GET `/small-bb/api/room-key/generate`

生成随机房间密钥。

**成功响应** (200)：

```json
{
    "success": true,
    "data": {
        "roomKey": "a1b2c3d4e5f6...",
        "length": 64
    }
}
```

---

#### POST `/small-bb/api/room-key/hash`

对房间密钥进行哈希处理（用于安全存储）。

**请求体**：

```json
{
    "roomKey": "my-room-secret-key"
}
```

**成功响应** (200)：

```json
{
    "success": true,
    "data": {
        "hash": "abc123def456...",
        "salt": "789ghi012jkl..."
    }
}
```

---

#### POST `/small-bb/api/room-key/verify`

验证房间密钥是否正确。

**请求体**：

```json
{
    "roomKey": "my-room-secret-key",
    "storedHash": "abc123def456...",
    "storedSalt": "789ghi012jkl..."
}
```

**成功响应** (200)：

```json
{
    "success": true,
    "data": {
        "valid": true
    }
}
```

---

#### POST `/small-bb/api/hajimi`

生成"哈基米"乱码文本。

**请求体**：

```json
{
    "length": 50
}
```

**成功响应** (200)：

```json
{
    "success": true,
    "data": {
        "garble": "哈基米基哈基米哈基哈基米基..."
    }
}
```

---

## 项目结构

```
small-bb/
├── controllers/                # 控制器模块
│   ├── index.js               # 控制器入口，统一导出
│   ├── cryptoController.js    # 加密/解密 API 控制器
│   ├── cryptoUtils.js         # 核心加密工具函数（服务端）
│   └── renderController.js    # 页面渲染控制器
├── public/                    # 静态资源
│   ├── assets/
│   │   └── style.css          # 像素风格样式表
│   └── test-standalone.html   # 独立测试页面（无需 NodeBB）
├── templates/                 # 模板文件
│   └── small-bb.tpl           # 主页面模板（含内联加密脚本）
├── index.html                 # 参考实现（UI 风格和加密逻辑参考）
├── ARCHITECTURE.md            # 系统架构与数据库设计文档
├── library.js                 # 插件入口文件
├── package.json               # npm 包配置
├── plugin.json                # NodeBB 插件注册配置
├── routes.js                  # 路由定义
└── README.md                  # 项目文档（本文件）
```

### 核心文件说明

| 文件 | 职责 |
|------|------|
| `library.js` | 插件生命周期管理，注册钩子和路由 |
| `routes.js` | 定义所有 HTTP 路由和中间件 |
| `controllers/cryptoUtils.js` | 服务端加密工具（AES-256-GCM、PBKDF2、Base-N） |
| `controllers/cryptoController.js` | 处理加密/解密 API 请求 |
| `controllers/renderController.js` | 渲染主页面模板 |
| `templates/small-bb.tpl` | 前端 UI 模板，包含客户端加密逻辑 |
| `public/assets/style.css` | 像素风格 CSS 样式 |
| `plugin.json` | NodeBB 插件元数据和钩子注册 |

---

## 安全设计

### 加密流程

```
发送消息:
  明文 → [AES-256-GCM 加密] → 二进制密文 → [Base-N 编码] → 文本密文 → 存储/传输

接收消息:
  文本密文 → [Base-N 解码] → 二进制密文 → [AES-256-GCM 解密] → 明文
                                                      ↓
                                              私钥错误 → "哈基米"乱码
```

### 安全措施

| 层级 | 措施 | 说明 |
|------|------|------|
| **传输层** | HTTPS/TLS 1.3 | 全站加密传输 |
| **应用层** | 客户端加密 | 消息在浏览器端加密，服务器不接触明文 |
| **密钥层** | PBKDF2 (100K 迭代) | 防止暴力破解密钥 |
| **加密层** | AES-256-GCM | 认证加密，同时提供机密性和完整性 |
| **存储层** | 仅存密文 | 数据库不存储任何明文消息 |
| **访问层** | NodeBB 认证 | 集成论坛用户认证系统 |

### 安全最佳实践

1. **私钥强度**：建议使用至少 32 字符的随机私钥
2. **私钥分发**：通过安全渠道（如面对面、加密邮件）分发房间私钥
3. **定期轮换**：建议每 90 天更换一次房间私钥
4. **字典选择**：使用足够长的字典（至少 3 个字符）以提高编码效率
5. **浏览器安全**：确保使用最新版本的浏览器，支持 Web Crypto API

### 浏览器兼容性

| 浏览器 | 最低版本 | Web Crypto API |
|--------|----------|----------------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 11+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| Opera | 47+ | ✅ 完全支持 |

---

## 故障排除

### 常见问题速查表

| 问题 | 症状 | 解决方案 |
|------|------|----------|
| 端口占用 | `EADDRINUSE` | [解决方案 1](#1-端口占用) |
| 依赖冲突 | `ERESOLVE` | [解决方案 2](#2-依赖冲突) |
| 数据库连接失败 | `MongoNetworkError` | [解决方案 3](#3-数据库连接失败) |
| 插件未激活 | 页面 404 | [解决方案 4](#4-插件未激活) |
| 加密失败 | `DOMException` | [解决方案 5](#5-加密解密失败) |
| Redis 连接失败 | `Redis connection error` | [解决方案 6](#6-redis-连接失败) |
| 权限不足 | `EACCES` | [解决方案 7](#7-权限不足) |

---

### 1. 端口占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::4567
```

**原因分析**：端口 4567 已被其他进程占用。

**解决方案**：

```bash
# Windows: 查找占用端口的进程
netstat -ano | findstr :4567
# 记下 PID，然后终止进程
taskkill /PID <PID> /F

# macOS / Linux: 查找占用端口的进程
lsof -i :4567
# 终止进程
kill -9 <PID>

# 或者修改 NodeBB 监听端口
# 编辑 config.json，修改 "port" 字段
```

---

### 2. 依赖冲突

**错误信息**：
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**原因分析**：npm 版本过高导致严格的依赖解析策略。

**解决方案**：

```bash
# 方式一：使用 --legacy-peer-deps 标志
npm install --legacy-peer-deps

# 方式二：降级 npm 版本
npm install -g npm@8

# 方式三：清除缓存后重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# 方式四：使用 yarn 替代 npm
npm install -g yarn
yarn install
```

---

### 3. 数据库连接失败

**错误信息**：
```
MongoNetworkError: failed to connect to server [localhost:27017]
```

**原因分析**：MongoDB 服务未启动或连接字符串配置错误。

**解决方案**：

```bash
# 1. 检查 MongoDB 服务状态
# Windows:
sc query MongoDB
# 启动服务:
net start MongoDB

# macOS:
brew services list | grep mongodb
brew services start mongodb-community

# Linux:
sudo systemctl status mongod
sudo systemctl start mongod

# 2. 测试 MongoDB 连接
mongosh --eval "db.runCommand({ ping: 1 })"

# 3. 检查 NodeBB config.json 中的数据库配置
# 确保 "url" 字段正确:
# "url": "mongodb://localhost:27017/nodebb"

# 4. 如果使用 Docker:
docker ps | grep mongo
# 如果容器未运行:
docker start mongodb
```

---

### 4. 插件未激活

**错误信息**：
```
Cannot GET /small-bb
```

**原因分析**：插件未正确安装或未在管理后台激活。

**解决方案**：

```bash
# 1. 确认插件文件存在
ls ./node_modules/small-bb/plugin.json
ls ./node_modules/small-bb/library.js

# 2. 重新构建 NodeBB
./nodebb build

# 3. 重启 NodeBB
./nodebb restart

# 4. 通过管理后台激活插件:
#    访问 http://localhost:4567/admin
#    进入 Plugins → Installed
#    找到 "小声BB加密通讯终端" → Activate

# 5. 检查 NodeBB 日志
./nodebb log | grep "small-bb"
```

---

### 5. 加密/解密失败

**错误信息**：
```
DOMException: The operation failed for an operation-specific reason
```

**原因分析**：
- 私钥不匹配
- 字典表不一致
- 密文被截断或修改
- 浏览器不支持 Web Crypto API

**解决方案**：

```bash
# 1. 确认私钥完全一致（包括大小写、空格）
# 2. 确认加密和解密使用相同的字典表
# 3. 确认密文完整复制，未被截断
# 4. 检查浏览器版本是否支持 Web Crypto API
#    在浏览器控制台执行:
#    console.log(window.crypto.subtle)

# 5. 使用独立测试页面验证加密功能:
#    npx http-server -p 8080 -c-1
#    访问 http://localhost:8080/test-standalone.html
```

---

### 6. Redis 连接失败

**错误信息**：
```
Error: Redis connection to localhost:6379 failed
```

**原因分析**：Redis 服务未启动。

**解决方案**：

```bash
# 1. 检查 Redis 服务状态
# macOS:
brew services list | grep redis
brew services start redis

# Linux:
sudo systemctl status redis-server
sudo systemctl start redis-server

# Docker:
docker start redis

# 2. 测试 Redis 连接
redis-cli ping
# 预期: PONG

# 3. 如果使用 Docker 安装 Redis:
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

---

### 7. 权限不足

**错误信息**：
```
Error: EACCES: permission denied
```

**原因分析**：文件或目录权限不足。

**解决方案**：

```bash
# macOS / Linux:
# 修改 NodeBB 目录权限
sudo chown -R $USER:$USER ./nodebb

# 修改 npm 全局目录权限
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Windows:
# 以管理员身份运行 PowerShell 或 CMD
# 右键 PowerShell → "以管理员身份运行"
```

---

### 8. npm 安装速度慢

**错误信息**：
```
npm ERR! network timeout
```

**原因分析**：网络连接 npm 官方仓库缓慢。

**解决方案**：

```bash
# 使用淘宝 npm 镜像（中国大陆用户）
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry
# 预期: https://registry.npmmirror.com

# 恢复默认配置
npm config delete registry

# 或者使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

---

### 9. NodeBB 构建失败

**错误信息**：
```
[build] Webpack compilation failed
```

**原因分析**：前端资源编译错误。

**解决方案**：

```bash
# 1. 清除构建缓存
rm -rf build public/uploads

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# 3. 重新构建
./nodebb build

# 4. 如果仍然失败，检查 Node.js 版本
node --version
# 确保 >= 16.0.0
```

---

### 10. 插件安装后页面空白

**错误信息**：页面无内容显示。

**原因分析**：模板文件路径错误或静态资源加载失败。

**解决方案**：

```bash
# 1. 检查模板文件是否存在
ls ./node_modules/small-bb/templates/small-bb.tpl

# 2. 检查静态资源配置
cat ./node_modules/small-bb/plugin.json
# 确认 "staticDirs" 配置正确

# 3. 清除浏览器缓存
# Chrome: Ctrl+Shift+Delete → 清除缓存

# 4. 检查浏览器控制台错误
# F12 → Console 标签页
```

---

## 开发指南

### 本地开发环境搭建

```bash
# 1. 克隆项目
git clone https://github.com/your-org/small-bb.git
cd small-bb

# 2. 安装开发依赖
npm install

# 3. 启动独立测试服务器
npx http-server -p 8080 -c-1

# 4. 浏览器访问测试页面
# http://localhost:8080/test-standalone.html
```

### 代码规范

- 使用 ES6+ 语法
- 遵循 NodeBB 插件开发规范
- 所有客户端加密逻辑使用原生 Web Crypto API
- 服务端加密使用 Node.js `crypto` 模块
- 保持代码简洁，添加必要注释

### 提交规范

```bash
# 提交信息格式
<type>(<scope>): <subject>

# 类型 (type):
# feat:     新功能
# fix:      修复 Bug
# docs:     文档更新
# style:    代码格式调整
# refactor: 代码重构
# test:     测试相关
# chore:    构建/工具相关

# 示例:
git commit -m "feat(crypto): 添加房间密钥轮换功能"
git commit -m "fix(ui): 修复移动端按钮布局错位"
git commit -m "docs(readme): 更新安装部署说明"
```

---

## 许可证

本项目基于 **MIT License** 开源。

```
MIT License

Copyright (c) 2026 Small_BB Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 致谢

- [NodeBB](https://nodebb.org/) - 优秀的开源论坛平台
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - 浏览器原生加密支持
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) - 像素风格字体

---

<p align="center">
  <sub>Built with ❤️ by Small_BB Team | © 2026</sub>
</p>
