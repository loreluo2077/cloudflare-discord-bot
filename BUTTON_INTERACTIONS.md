# Discord Bot 按钮交互功能文档

## 📋 目录

- [概述](#概述)
- [事件处理机制](#事件处理机制)
- [文件结构](#文件结构)
- [API 端点](#api-端点)
- [按钮样式](#按钮样式)
- [预设按钮功能](#预设按钮功能)
- [自定义按钮处理器](#自定义按钮处理器)
- [使用示例](#使用示例)
- [响应类型](#响应类型)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

## 概述

本 Discord Bot 支持发送带有交互式按钮的消息。用户点击按钮后，Bot
会立即响应并执行相应的操作。支持多种响应类型和自定义处理逻辑。

## 事件处理机制

### 工作流程

```
用户点击按钮 → Discord 发送 MESSAGE_COMPONENT 交互 → Bot 处理 → 返回响应
```

### 交互数据结构

当用户点击按钮时，Discord 会发送包含以下信息的交互：

- `interaction.data.custom_id` - 按钮的 custom_id
- `interaction.user` - 点击用户的信息
- `interaction.guild_id` - 服务器 ID
- `interaction.channel_id` - 频道 ID
- `interaction.message` - 原始消息信息

## 文件结构

```
src/
├── server.js              # 主服务器，处理所有 Discord 交互
├── button-handlers.js     # 按钮处理器，管理所有按钮逻辑
├── custom.js             # 自定义 API 路由
└── ...
custom-button-examples.js  # 示例文件（可选）
```

## API 端点

### 1. 发送普通消息

```http
POST /custom/send-message
```

**请求体：**

```json
{
    "channelId": "1234567890123456789",
    "content": "你好，这是来自 API 的消息！"
}
```

### 2. 发送带按钮的消息

```http
POST /custom/send-message-with-buttons
```

**请求体：**

```json
{
    "channelId": "1234567890123456789",
    "content": "请选择您的操作：",
    "buttons": [
        {
            "label": "确认",
            "custom_id": "confirm_action",
            "style": 3
        },
        {
            "label": "取消",
            "custom_id": "cancel_action",
            "style": 4
        },
        {
            "label": "访问帮助",
            "url": "https://example.com/help",
            "style": 5
        }
    ]
}
```

### 3. 发送示例按钮消息

```http
POST /custom/send-demo-buttons
```

**请求体：**

```json
{
    "channelId": "1234567890123456789",
    "content": "这是我的自定义消息！" // 可选
}
```

### 4. 获取频道信息

```http
GET /custom/channel/{channelId}
```

### 5. API 文档

```http
GET /custom/docs
```

## 按钮样式

| 样式值 | 颜色 | 说明                  | 用途       |
| ------ | ---- | --------------------- | ---------- |
| 1      | 蓝色 | Primary（主要按钮）   | 主要操作   |
| 2      | 灰色 | Secondary（次要按钮） | 次要操作   |
| 3      | 绿色 | Success（成功按钮）   | 确认、同意 |
| 4      | 红色 | Danger（危险按钮）    | 删除、拒绝 |
| 5      | 链接 | Link（链接按钮）      | 外部链接   |

## 预设按钮功能

### 基础交互按钮

| 按钮 ID           | 标签    | 功能         | 响应类型  |
| ----------------- | ------- | ------------ | --------- |
| `like_button`     | 👍 点赞 | 显示点赞消息 | EPHEMERAL |
| `favorite_button` | ❤️ 收藏 | 显示收藏消息 | EPHEMERAL |
| `share_button`    | 🔄 分享 | 显示分享消息 | EPHEMERAL |
| `report_button`   | ⚠️ 举报 | 显示举报消息 | EPHEMERAL |

### 操作确认按钮

| 按钮 ID          | 标签    | 功能               | 响应类型  |
| ---------------- | ------- | ------------------ | --------- |
| `confirm_action` | ✅ 确认 | 确认操作并移除按钮 | UPDATE    |
| `cancel_action`  | ❌ 取消 | 取消操作并移除按钮 | UPDATE    |
| `agree`          | ✅ 同意 | 显示同意消息       | EPHEMERAL |
| `decline`        | ❌ 拒绝 | 显示拒绝消息       | EPHEMERAL |

### 功能性按钮

| 按钮 ID            | 标签        | 功能             | 响应类型  |
| ------------------ | ----------- | ---------------- | --------- |
| `counter_button`   | 🔢 计数器   | 公开显示点击计数 | PUBLIC    |
| `timestamp_button` | ⏰ 获取时间 | 显示当前时间     | EPHEMERAL |

## 自定义按钮处理器

### 添加新按钮处理器

在 `src/button-handlers.js` 中添加：

```javascript
buttonHandler.register(
    "my_custom_button",
    async (interaction, env, { userName, userId }) => {
        // 您的自定义逻辑
        return buttonHandler.createResponse(
            `🎉 ${userName} 点击了自定义按钮！`,
            ButtonResponseType.EPHEMERAL,
        );
    },
);
```

### 高级示例

#### 1. 简单问候按钮

```javascript
buttonHandler.register(
    "hello_button",
    async (interaction, env, { userName }) => {
        return buttonHandler.createResponse(
            `👋 你好，${userName}！欢迎使用我们的 Discord Bot！`,
            ButtonResponseType.EPHEMERAL,
        );
    },
);
```

#### 2. 服务器信息按钮

```javascript
buttonHandler.register(
    "server_info_button",
    async (interaction, env, { userName }) => {
        const guildId = interaction.guild_id;
        const channelId = interaction.channel_id;

        return buttonHandler.createResponse(
            `🏠 服务器信息：\n` +
                `• 服务器 ID: ${guildId}\n` +
                `• 频道 ID: ${channelId}\n` +
                `• 请求用户: ${userName}`,
            ButtonResponseType.EPHEMERAL,
        );
    },
);
```

#### 3. 投票按钮（带状态更新）

```javascript
let voteCount = { yes: 0, no: 0 };

buttonHandler.register("vote_yes", async (interaction, env, { userName }) => {
    voteCount.yes++;

    const voteButtons = [
        {
            type: 1, // ACTION_ROW
            components: [
                {
                    type: 2, // BUTTON
                    style: 3, // Success
                    label: `✅ 赞成 (${voteCount.yes})`,
                    custom_id: "vote_yes",
                },
                {
                    type: 2, // BUTTON
                    style: 4, // Danger
                    label: `❌ 反对 (${voteCount.no})`,
                    custom_id: "vote_no",
                },
            ],
        },
    ];

    return buttonHandler.createResponse(
        `📊 投票结果更新！${userName} 投了赞成票。`,
        ButtonResponseType.UPDATE,
        voteButtons,
    );
});
```

#### 4. 权限检查按钮

```javascript
buttonHandler.register(
    "admin_only_button",
    async (interaction, env, { userName, userId }) => {
        const adminUsers = ["123456789012345678"]; // 管理员用户 ID 列表

        if (!adminUsers.includes(userId)) {
            return buttonHandler.createResponse(
                `🚫 ${userName}，此功能仅限管理员使用。`,
                ButtonResponseType.EPHEMERAL,
            );
        }

        return buttonHandler.createResponse(
            `👑 ${userName}，管理员功能已激活！`,
            ButtonResponseType.EPHEMERAL,
        );
    },
);
```

## 使用示例

### cURL 示例

#### 发送带按钮的消息

```bash
curl -X POST https://your-worker.workers.dev/custom/send-message-with-buttons \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "1234567890123456789",
    "content": "请选择您的操作：",
    "buttons": [
      {"label": "✅ 同意", "custom_id": "agree", "style": 3},
      {"label": "❌ 拒绝", "custom_id": "decline", "style": 4},
      {"label": "📖 查看详情", "url": "https://example.com", "style": 5}
    ]
  }'
```

#### 发送示例按钮消息

```bash
curl -X POST https://your-worker.workers.dev/custom/send-demo-buttons \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "1234567890123456789"
  }'
```

### JavaScript 示例

```javascript
// 发送带按钮的消息
async function sendButtonMessage(channelId, content, buttons) {
    const response = await fetch("/custom/send-message-with-buttons", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            channelId,
            content,
            buttons,
        }),
    });

    return await response.json();
}

// 使用示例
const buttons = [
    { label: "👍 点赞", custom_id: "like_button", style: 3 },
    { label: "❤️ 收藏", custom_id: "favorite_button", style: 1 },
];

sendButtonMessage("1234567890123456789", "请点击按钮：", buttons);
```

## 响应类型

### ButtonResponseType 枚举

| 类型        | 说明     | 用途             |
| ----------- | -------- | ---------------- |
| `EPHEMERAL` | 私密响应 | 只有点击者能看到 |
| `PUBLIC`    | 公开响应 | 所有人都能看到   |
| `UPDATE`    | 更新消息 | 修改原消息内容   |
| `DEFERRED`  | 延迟响应 | 用于长时间处理   |

### 创建响应

```javascript
// 私密响应
buttonHandler.createResponse(
    "这是私密消息",
    ButtonResponseType.EPHEMERAL,
);

// 公开响应
buttonHandler.createResponse(
    "这是公开消息",
    ButtonResponseType.PUBLIC,
);

// 更新消息（移除按钮）
buttonHandler.createResponse(
    "操作已完成",
    ButtonResponseType.UPDATE,
    [], // 空数组移除所有按钮
);
```

## 错误处理

### 常见错误

1. **频道 ID 无效**
   ```json
   {
       "error": "channelId 格式无效"
   }
   ```

2. **按钮配置错误**
   ```json
   {
       "error": "按钮 1 缺少有效的 label 字段"
   }
   ```

3. **权限不足**
   ```json
   {
       "error": "频道未找到或 Bot 无权限访问"
   }
   ```

### 错误处理最佳实践

```javascript
buttonHandler.register(
    "safe_button",
    async (interaction, env, { userName }) => {
        try {
            // 您的逻辑
            return buttonHandler.createResponse(
                `✅ 操作成功！`,
                ButtonResponseType.EPHEMERAL,
            );
        } catch (error) {
            console.error("按钮处理出错:", error);
            return buttonHandler.createResponse(
                `❌ 操作失败: ${error.message}`,
                ButtonResponseType.EPHEMERAL,
            );
        }
    },
);
```

## 最佳实践

### 1. 按钮设计原则

- 使用清晰的标签文本
- 选择合适的颜色样式
- 限制每行按钮数量（最多 5 个）
- 使用有意义的 custom_id

### 2. 响应类型选择

- 个人操作使用 `EPHEMERAL`
- 公共信息使用 `PUBLIC`
- 状态更新使用 `UPDATE`
- 长时间处理使用 `DEFERRED`

### 3. 安全考虑

- 验证用户权限
- 限制操作频率
- 验证输入数据
- 记录重要操作

### 4. 性能优化

- 缓存频繁使用的数据
- 避免在按钮处理中进行长时间操作
- 使用适当的响应类型

### 5. 用户体验

- 提供清晰的反馈
- 使用合适的表情符号
- 保持响应的一致性
- 处理边界情况

### 6. 限制和注意事项

#### Discord 限制

- 每条消息最多 25 个按钮
- 每行最多 5 个按钮
- 按钮标签最多 80 个字符
- custom_id 最多 100 个字符

#### 技术限制

- 按钮点击后必须在 3 秒内响应
- 延迟响应后有 15 分钟时间发送 followup
- 链接按钮不会触发交互事件

#### 开发建议

- 测试所有按钮功能
- 处理网络错误
- 提供用户友好的错误消息
- 定期清理无用的按钮处理器

---

## 🔗 相关链接

- [Discord Interactions API](https://discord.com/developers/docs/interactions/receiving-and-responding)
- [Discord Button Components](https://discord.com/developers/docs/interactions/message-components#buttons)
- [Cloudflare Workers](https://workers.cloudflare.com/)

## 📝 更新日志

- **v1.0.0** - 初始版本，支持基本按钮交互
- **v1.1.0** - 添加模块化按钮处理器
- **v1.2.0** - 增加示例和文档

---

_最后更新：2024年12月_
