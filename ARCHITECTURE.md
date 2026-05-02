# 小声BB (Small_BB) - 系统架构与数据库设计文档

## 版本信息
- **项目名称**：小声BB (Small_BB)
- **版本**：2.0.0
- **日期**：2026-05-02
- **状态**：架构设计阶段

---

## 一、系统架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端层 (Client Layer)                    │
├─────────────────────────────────────────────────────────────────┤
│  Web Client                                                     │
│  ├── 用户界面 (UI)                                               │
│  ├── 加密模块 (Crypto Module)                                    │
│  └── 实时通信 (Socket.IO Client)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        网关层 (Gateway Layer)                     │
├─────────────────────────────────────────────────────────────────┤
│  Nginx/负载均衡                                                   │
│  ├── SSL/TLS 终端                                                │
│  ├── 静态资源服务                                                │
│  └── WebSocket 代理                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     应用服务层 (Application Layer)                │
├─────────────────────────────────────────────────────────────────┤
│  NodeBB + 自定义插件                                              │
│  ├── 用户认证模块 (Passport.js)                                  │
│  ├── 房间管理模块 (Room Management)                              │
│  ├── 消息处理模块 (Message Handler)                              │
│  ├── 加密服务模块 (Encryption Service)                           │
│  └── WebSocket 服务 (Socket.IO)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据层 (Data Layer)                        │
├─────────────────────────────────────────────────────────────────┤
│  Primary Database: MongoDB                                      │
│  ├── 用户数据 (Users)                                            │
│  ├── 房间数据 (Rooms)                                            │
│  ├── 消息数据 (Messages)                                         │
│  └── 权限数据 (Permissions)                                      │
│                                                                  │
│  Cache Layer: Redis                                               │
│  ├── 会话缓存 (Session Store)                                    │
│  ├── 在线状态 (Online Status)                                    │
│  └── 消息队列 (Message Queue)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心模块架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    小声BB核心模块架构                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   用户模块   │────▶│   房间模块   │────▶│  消息模块    │   │
│  │  (Users)    │     │  (Rooms)     │     │ (Messages)  │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                    │                    │            │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    加密服务模块                          │  │
│  │              (Encryption Service)                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │ PBKDF2  │  │ AES-GCM │  │ Base-N  │  │ 密钥管理 │   │  │
│  │  │ 密钥派生 │  │  对称加密 │  │ 编码转换 │  │ (Key Mgmt)│   │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    访问控制模块                          │  │
│  │               (Access Control Module)                   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                │  │
│  │  │ 房间权限 │  │  用户角色 │  │  操作审计 │                │  │
│  │  │(Room ACL)│  │(User Role)│  │ (Audit) │                │  │
│  │  └─────────┘  └─────────┘  └─────────┘                │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 数据流架构

```
用户发送消息流程：
┌────────┐    ┌─────────┐    ┌──────────┐    ┌────────┐    ┌────────┐
│ 用户A  │───▶│ 输入消息 │───▶│ 加密消息  │───▶│ 存储密文│───▶│ 广播消息│
│        │    │ +私钥   │    │(AES-GCM)│    │(MongoDB)│    │(Socket.IO)│
└────────┘    └─────────┘    └──────────┘    └────────┘    └────────┘
                                                                        │
用户接收消息流程：                                                      │
┌────────┐    ┌─────────┐    ┌──────────┐    ┌────────┐                 │
│ 用户B  │◀───│ 收到密文 │◀───│ 验证私钥  │◀───│ 获取密文 │◀────────┘
│        │    │         │    │(PBKDF2)  │    │(MongoDB)│
└────────┘    └─────────┘    └──────────┘    └────────┘
     │
     ├──▶ 私钥正确 ──▶ 解密显示原文
     │
     └──▶ 私钥错误 ──▶ 显示"哈基米"乱码
```

---

## 二、数据库设计

### 2.1 数据库选择

**主数据库**：MongoDB 6.0+
- 理由：文档型数据库，灵活的结构适合消息存储
- 支持复制集和高可用
- 内置全文搜索能力

**缓存/会话**：Redis 7.0+
- 会话存储
- 实时在线状态
- 消息发布/订阅

### 2.2 Schema 设计

#### 2.2.1 用户集合 (Users)

```javascript
// Collection: users
{
  "_id": ObjectId("..."),

  // 基本信息
  "username": String,           // 用户名（唯一）
  "email": String,              // 邮箱（唯一）
  "passwordHash": String,       // 密码哈希（bcrypt）
  "passwordSalt": String,       // 密码盐

  // 用户元数据
  "displayName": String,        // 显示名称
  "avatarUrl": String,          // 头像URL
  "bio": String,                // 个人简介

  // 安全设置
  "userPrivateKey": String,     // 用户个人私钥（加密存储）
  "privateKeySalt": String,     // 私钥盐值

  // 账户状态
  "status": String,             // "active" | "banned" | "suspended"
  "emailVerified": Boolean,     // 邮箱已验证
  "createdAt": Date,
  "updatedAt": Date,
  "lastLoginAt": Date,

  // 在线状态（Redis缓存）
  "onlineStatus": {
    "isOnline": Boolean,
    "lastSeen": Date,
    "currentRoom": ObjectId,    // 所在房间
    "socketId": String
  },

  // 索引
  "indexes": [
    { "username": 1 },
    { "email": 1 },
    { "status": 1 }
  ]
}
```

#### 2.2.2 房间集合 (Rooms)

```javascript
// Collection: rooms
{
  "_id": ObjectId("..."),

  // 房间基本信息
  "name": String,               // 房间名称
  "description": String,        // 房间描述
  "type": String,               // "public" | "private" | "direct"

  // 房间所有者
  "ownerId": ObjectId,          // 所有者用户ID
  "ownerName": String,          // 所有者用户名（冗余）

  // 加密设置
  "encryption": {
    "enabled": Boolean,         // 是否启用加密
    "algorithm": String,        // "AES-256-GCM"
    "roomKeyHash": String,      // 房间密钥哈希（用于验证，不存储明文）
    "roomKeySalt": String,      // 密钥盐
    "createdAt": Date,          // 密钥创建时间
    "keyVersion": Number,       // 密钥版本号
    "previousKeyHash": String,  // 旧密钥哈希（用于过渡期）
    "keyRotationDate": Date    // 密钥轮换日期
  },

  // 房间设置
  "settings": {
    "maxMembers": Number,       // 最大成员数（0=无限制）
    "allowGuest": Boolean,      // 允许游客访问
    "requireApproval": Boolean,  // 需要批准才能加入
    "messageRetention": Number,  // 消息保留天数
    "encryptedHistory": Boolean  // 加密历史消息
  },

  // 成员管理
  "members": [
    {
      "userId": ObjectId,
      "username": String,
      "role": String,           // "owner" | "admin" | "member"
      "joinedAt": Date,
      "hasKey": Boolean         // 是否拥有房间密钥
    }
  ],

  // 统计信息
  "stats": {
    "memberCount": Number,
    "messageCount": Number,
    "lastActivityAt": Date
  },

  // 状态
  "isActive": Boolean,
  "createdAt": Date,
  "updatedAt": Date,

  // 索引
  "indexes": [
    { "ownerId": 1 },
    { "type": 1 },
    { "isActive": 1 },
    { "createdAt": -1 },
    { "members.userId": 1 }
  ]
}
```

#### 2.2.3 消息集合 (Messages)

```javascript
// Collection: messages
{
  "_id": ObjectId("..."),

  // 消息关联
  "roomId": ObjectId,           // 房间ID
  "userId": ObjectId,           // 发送者ID
  "username": String,            // 发送者用户名（冗余）

  // 消息内容（加密存储）
  "content": {
    "encrypted": Boolean,       // 是否加密
    "ciphertext": String,       // 密文（Base-N编码）
    "iv": String,               // 初始向量（十六进制）
    "salt": String,             // 盐值（十六进制）
    "keyVersion": Number,       // 加密时使用的密钥版本
    "originalLength": Number    // 原始文本长度（用于验证）
  },

  // 消息类型
  "type": String,               // "text" | "image" | "file" | "system"

  // 附件（可选）
  "attachments": [
    {
      "type": String,           // "image" | "file"
      "url": String,
      "filename": String,
      "size": Number,
      "encrypted": Boolean
    }
  ],

  // 回复和引用
  "replyTo": ObjectId,          // 回复的消息ID
  "quotedText": String,         // 引用的文本（可能是密文）

  // 用户私钥加密（用于私钥共享场景）
  "encryptedForUsers": [
    {
      "userId": ObjectId,
      "encryptedKey": String,   // 用接收者公钥加密的会话密钥
      "algorithm": String
    }
  ],

  // 元数据
  "metadata": {
    "editedAt": Date,           // 编辑时间
    "deletedAt": Date,          // 删除时间
    "ipAddress": String,        // IP地址（可选项）
    "deviceInfo": String        // 设备信息
  },

  // 状态
  "status": String,             // "sent" | "delivered" | "read" | "deleted"
  "createdAt": Date,
  "updatedAt": Date,

  // 索引
  "indexes": [
    { "roomId": 1, "createdAt": -1 },
    { "userId": 1, "createdAt": -1 },
    { "roomId": 1, "userId": 1 },
    { "status": 1 },
    { "createdAt": -1 }
  ]
}
```

#### 2.2.4 房间密钥历史 (Room Key History)

```javascript
// Collection: room_keys
{
  "_id": ObjectId("..."),

  // 密钥关联
  "roomId": ObjectId,           // 房间ID

  // 密钥信息
  "keyVersion": Number,         // 密钥版本
  "keyHash": String,            // 密钥哈希（PBKDF2）
  "keySalt": String,            // 密钥盐
  "encryptedKey": String,        // 加密的房间密钥（用于备份）

  // 密钥元数据
  "createdBy": ObjectId,        // 创建者
  "createdAt": Date,
  "expiresAt": Date,            // 过期时间（可选）

  // 状态
  "isActive": Boolean,          // 是否当前有效
  "revokedAt": Date,            // 撤销时间
  "revokedBy": ObjectId,        // 撤销者

  // 变更原因
  "reason": String,             // 变更原因描述

  // 索引
  "indexes": [
    { "roomId": 1, "keyVersion": -1 },
    { "roomId": 1, "isActive": 1 }
  ]
}
```

#### 2.2.5 用户-房间访问令牌 (User Room Tokens)

```javascript
// Collection: user_room_tokens
{
  "_id": ObjectId("..."),

  // 关联信息
  "userId": ObjectId,
  "roomId": ObjectId,

  // 令牌信息
  "token": String,               // 访问令牌（加密存储）
  "tokenHash": String,          // 令牌哈希

  // 权限级别
  "permissions": {
    "canView": Boolean,         // 可查看
    "canSend": Boolean,         // 可发送
    "canEdit": Boolean,         // 可编辑
    "canDelete": Boolean,       // 可删除
    "canManage": Boolean        // 可管理（仅管理员/所有者）
  },

  // 加密相关
  "hasRoomKey": Boolean,        // 是否拥有房间密钥
  "keyEncrypted": String,       // 用用户私钥加密的房间密钥副本

  // 有效期
  "expiresAt": Date,
  "createdAt": Date,
  "lastUsedAt": Date,

  // 状态
  "isActive": Boolean,
  "revokedAt": Date,

  // 索引
  "indexes": [
    { "userId": 1, "roomId": 1 },
    { "tokenHash": 1 },
    { "expiresAt": 1 }
  ]
}
```

#### 2.2.6 审计日志 (Audit Logs)

```javascript
// Collection: audit_logs
{
  "_id": ObjectId("..."),

  // 操作信息
  "action": String,             // "room.create" | "room.key.rotate" | etc.
  "category": String,           // "room" | "message" | "user" | "key"

  // 执行者
  "userId": ObjectId,
  "username": String,
  "ipAddress": String,
  "userAgent": String,

  // 目标
  "targetType": String,         // "room" | "message" | "user"
  "targetId": ObjectId,
  "targetName": String,

  // 变更详情
  "changes": {
    "before": Object,           // 变更前的值
    "after": Object             // 变更后的值
  },

  // 结果
  "result": String,             // "success" | "failure"
  "errorMessage": String,       // 错误信息（如果失败）

  // 时间戳
  "timestamp": Date,

  // 索引
  "indexes": [
    { "userId": 1, "timestamp": -1 },
    { "roomId": 1, "timestamp": -1 },
    { "action": 1, "timestamp": -1 },
    { "timestamp": -1 }
  ]
}
```

---

## 三、私钥管理系统设计

### 3.1 私钥生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                    私钥生命周期管理                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  创建 ──▶ 分发 ──▶ 使用 ──▶ 轮换 ──▶ 撤销                      │
│    │                                      │                      │
│    │                                      │                      │
│    └──────────────────────────────────────┘                      │
│                        (历史存档)                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  详细流程：                                              │    │
│  │                                                          │    │
│  │  1. 创建 (Create)                                       │    │
│  │     - 房间所有者生成随机私钥                             │    │
│  │     - 使用 PBKDF2 派生密钥哈希                          │    │
│  │     - 将密文存储到数据库                                │    │
│  │                                                          │    │
│  │  2. 分发 (Distribute)                                   │    │
│  │     - 所有者选择可信任的成员                            │    │
│  │     - 用成员的用户公钥加密房间私钥                      │    │
│  │     - 通过安全通道分发                                  │    │
│  │                                                          │    │
│  │  3. 使用 (Use)                                         │    │
│  │     - 消息加密/解密                                     │    │
│  │     - 实时验证私钥                                      │    │
│  │                                                          │    │
│  │  4. 轮换 (Rotate)                                       │    │
│  │     - 生成新私钥                                        │    │
│  │     - 保留旧私钥（有过渡期）                            │    │
│  │     - 通知所有成员                                      │    │
│  │                                                          │    │
│  │  5. 撤销 (Revoke)                                       │    │
│  │     - 标记旧密钥为已撤销                                │    │
│  │     - 记录审计日志                                      │    │
│  │     - 通知受影响用户                                    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 私钥存储安全

#### 3.2.1 存储原则

1. **永不存储明文**：私钥明文从不写入数据库
2. **分层加密**：使用主密钥加密房间私钥
3. **盐值管理**：每个私钥有唯一的盐值
4. **密钥版本**：支持密钥历史和回滚

#### 3.2.2 加密流程

```javascript
/**
 * 私钥加密存储流程
 */

// 1. 生成房间私钥
const roomKey = crypto.randomBytes(32);  // 256位

// 2. 生成盐值
const salt = crypto.randomBytes(16);

// 3. 使用 PBKDF2 派生存储密钥
const storageKey = crypto.pbkdf2Sync(
  roomKey,
  salt,
  100000,  // 迭代次数
  32,      // 密钥长度
  'sha256'
);

// 4. 加密房间私钥
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', storageKey, iv);
let encrypted = cipher.update(roomKey);
encrypted = Buffer.concat([encrypted, cipher.final()]);
const authTag = cipher.getAuthTag();

// 5. 存储到数据库
const roomKeyRecord = {
  roomId: roomObjectId,
  keyVersion: 1,
  keySalt: salt.toString('hex'),
  encryptedKey: encrypted.toString('hex'),
  iv: iv.toString('hex'),
  authTag: authTag.toString('hex'),
  createdAt: new Date(),
  isActive: true
};
```

### 3.3 私钥验证机制

```javascript
/**
 * 私钥验证流程
 */

// 用户提交私钥
const userSubmittedKey = "用户输入的私钥";

// 从数据库获取盐值
const salt = Buffer.from(storedKeySalt, 'hex');

// 使用 PBKDF2 派生密钥
const derivedKey = crypto.pbkdf2Sync(
  userSubmittedKey,
  salt,
  100000,
  32,
  'sha256'
);

// 与存储的哈希比对
const isValid = crypto.timingSafeEqual(derivedKey, storedKeyHash);

if (isValid) {
  // 私钥正确，允许解密
  return decryptMessage(ciphertext, userSubmittedKey);
} else {
  // 私钥错误，显示哈基米乱码
  return generateHajimiGarble(originalText);
}
```

---

## 四、访问控制设计

### 4.1 权限模型

```
┌─────────────────────────────────────────────────────────────────┐
│                    基于角色的访问控制 (RBAC)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  房间所有者 (Room Owner)                                         │
│  ├── 所有权限                                                    │
│  ├── 管理房间设置                                                │
│  ├── 添加/移除管理员                                             │
│  ├── 创建/轮换/撤销私钥                                          │
│  └── 删除房间                                                    │
│                                                                  │
│  管理员 (Admin)                                                  │
│  ├── 发送/编辑/删除消息                                          │
│  ├── 禁言用户                                                    │
│  ├── 查看加密消息                                                │
│  └── 管理普通成员                                                │
│                                                                  │
│  成员 (Member)                                                   │
│  ├── 发送消息                                                    │
│  ├── 查看加密消息（需私钥）                                      │
│  ├── 接收房间私钥分发                                            │
│  └── 离开房间                                                    │
│                                                                  │
│  游客 (Guest) - 仅公开房间                                       │
│  ├── 查看公开消息（密文）                                        │
│  ├── 加入房间（需批准）                                          │
│  └── 无法解密消息                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 数据访问控制矩阵

| 操作 | 所有者 | 管理员 | 成员 | 游客 |
|------|--------|--------|------|------|
| 查看房间信息 | ✅ | ✅ | ✅ | ✅ |
| 发送消息 | ✅ | ✅ | ✅ | ❌ |
| 编辑自己的消息 | ✅ | ✅ | ✅ | ❌ |
| 删除自己的消息 | ✅ | ✅ | ✅ | ❌ |
| 删除他人消息 | ✅ | ✅ | ❌ | ❌ |
| 查看加密内容 | ✅ | ✅ | 需私钥 | ❌ |
| 管理房间私钥 | ✅ | ❌ | ❌ | ❌ |
| 添加/移除成员 | ✅ | ✅ | ❌ | ❌ |
| 修改房间设置 | ✅ | ❌ | ❌ | ❌ |

---

## 五、安全性设计

### 5.1 安全措施

#### 5.1.1 传输安全
- 全站 HTTPS/TLS 1.3
- WebSocket over WSS
- 证书固定 (Certificate Pinning)

#### 5.1.2 存储安全
- 密码 bcrypt (cost factor 12)
- 私钥 AES-256-GCM
- PBKDF2 (100,000 迭代)
- 独立的密钥加密密钥 (KEK)

#### 5.1.3 应用安全
- CSRF Token
- XSS 防护
- SQL/NoSQL 注入防护
- 速率限制 (Rate Limiting)
- 输入验证

### 5.2 密钥安全要求

```
┌─────────────────────────────────────────────────────────────────┐
│                      密钥安全要求                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 密钥生成                                                     │
│     - 最小 256 位随机数                                          │
│     - 使用 crypto.getRandomValues() 或 crypto.randomBytes()      │
│     - 确保足够的熵                                               │
│                                                                  │
│  2. 密钥存储                                                     │
│     - 永不存储明文                                               │
│     - 使用独立的加密密钥 (KEK)                                   │
│     - 分离存储加密内容和密钥                                     │
│                                                                  │
│  3. 密钥分发                                                     │
│     - 使用非对称加密分发对称密钥                                 │
│     - 安全通道传输                                               │
│     - 记录分发历史                                               │
│                                                                  │
│  4. 密钥轮换                                                     │
│     - 定期轮换（建议 90 天）                                     │
│     - 支持过渡期（旧密钥仍可解密）                               │
│     - 记录轮换历史                                               │
│                                                                  │
│  5. 密钥撤销                                                     │
│     - 即时撤销能力                                               │
│     - 通知受影响用户                                             │
│     - 完整审计日志                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、数据库索引策略

### 6.1 索引设计原则

1. **高频查询优先**：为常见查询创建复合索引
2. **写入性能平衡**：避免过多索引影响写入性能
3. **覆盖索引**：尽量使用覆盖索引减少回表查询
4. **分片策略**：考虑数据量增长进行分片

### 6.2 关键索引

```javascript
// 用户集合
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "status": 1 })
db.users.createIndex({ "onlineStatus.isOnline": 1, "onlineStatus.lastSeen": -1 })

// 房间集合
db.rooms.createIndex({ "ownerId": 1 })
db.rooms.createIndex({ "type": 1, "isActive": 1 })
db.rooms.createIndex({ "members.userId": 1 })
db.rooms.createIndex({ "createdAt": -1 })
db.rooms.createIndex(
  { "name": "text", "description": "text" },
  { weights: { name: 10, description: 5 } }
)

// 消息集合
db.messages.createIndex({ "roomId": 1, "createdAt": -1 })
db.messages.createIndex({ "userId": 1, "createdAt": -1 })
db.messages.createIndex({ "roomId": 1, "userId": 1, "createdAt": -1 })
db.messages.createIndex({ "content.encrypted": 1, "createdAt": -1 })

// 密钥历史
db.room_keys.createIndex({ "roomId": 1, "keyVersion": -1 })
db.room_keys.createIndex({ "roomId": 1, "isActive": 1 })

// 审计日志
db.audit_logs.createIndex({ "userId": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "targetType": 1, "targetId": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "action": 1, "timestamp": -1 })
```

---

## 七、性能优化建议

### 7.1 查询优化

1. **消息分页**：限制单次查询返回的消息数量（建议 50 条）
2. **按需加载**：历史消息使用游标分页
3. **字段投影**：只查询需要的字段
4. **连接池**：合理配置数据库连接池

### 7.2 缓存策略

```javascript
// Redis 缓存策略
const cacheConfig = {
  // 用户会话
  userSession: {
    ttl: 24 * 60 * 60,  // 24小时
    prefix: 'session:'
  },

  // 房间信息
  roomInfo: {
    ttl: 5 * 60,        // 5分钟
    prefix: 'room:'
  },

  // 在线状态
  onlineStatus: {
    ttl: 0,              // 实时更新
    prefix: 'online:'
  },

  // 消息缓存（最近消息）
  recentMessages: {
    ttl: 5 * 60,        // 5分钟
    prefix: 'msg:recent:',
    maxSize: 100        // 每个房间缓存100条
  }
};
```

---

## 八、备份与恢复

### 8.1 备份策略

1. **全量备份**：每日凌晨 3:00
2. **增量备份**：每 6 小时
3. **实时复制**：主从复制 + oplog
4. **异地备份**：跨数据中心复制

### 8.2 恢复计划

```
恢复场景：
├── 软删除恢复（24小时内）
│   └── 从 deletedAt 字段恢复
├── 硬删除恢复
│   └── 从备份恢复 + oplog 重放
└── 灾难恢复
    └── 全量恢复 + 增量恢复
```

---

## 九、监控与告警

### 9.1 关键指标

1. **性能指标**
   - 查询响应时间 (P95, P99)
   - 消息延迟
   - 并发连接数

2. **安全指标**
   - 认证失败率
   - 私钥验证失败次数
   - 异常访问模式

3. **业务指标**
   - 日活跃用户 (DAU)
   - 消息量
   - 房间创建率

### 9.2 告警阈值

```javascript
const alertThresholds = {
  // 性能
  queryLatencyP99: 1000,      // ms
  messageDeliveryDelay: 5000, // ms

  // 安全
  authFailureRate: 0.1,       // 10%
  keyVerificationFailures: 100, // 每分钟

  // 系统
  errorRate: 0.05,            // 5%
  cpuUsage: 0.8,              // 80%
  memoryUsage: 0.85            // 85%
};
```

---

## 十、实施建议

### 阶段一：基础建设（第1-2周）
- [ ] 数据库架构实现
- [ ] 用户认证模块
- [ ] 基础房间管理

### 阶段二：加密系统（第3-4周）
- [ ] 加密服务模块
- [ ] 私钥管理系统
- [ ] 消息加密/解密

### 阶段三：高级功能（第5-6周）
- [ ] 实时消息推送
- [ ] 私钥分发机制
- [ ] 密钥轮换系统

### 阶段四：测试与优化（第7-8周）
- [ ] 安全测试
- [ ] 性能测试
- [ ] 用户体验优化

---

*文档版本：1.0*
*最后更新：2026-05-02*
