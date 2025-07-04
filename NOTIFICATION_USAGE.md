# 区块链通知消息类型使用说明

## 概述

新增的 `notification` 消息类型专门用于发送格式化的区块链相关通知消息，包含用户地址、合约地址、代币信息和状态信息。

## 使用方法

### 基本用法

向 `/custom/send-message-by-type` 端点发送 POST 请求：

```json
{
  "channelId": "YOUR_DISCORD_CHANNEL_ID",
  "messageType": "notification",
  "notificationData": {
    "id": 2,
    "userAddress": "0xd8A31910A35fFbaA6D0467eB935A7ce9860482c0",
    "contractAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "tokenSymbol": "USDT",
    "balance": "9379996",
    "formattedBalance": "9.379996",
    "tokenValue": 9.379996,
    "contract_status": "found",
    "approval_status": "none",
    "transfer_status": "none",
    "approvalAmount": null,
    "approvalTransactionHash": null,
    "createdAt": "2025-07-03 07:41:52",
    "updatedAt": "2025-07-03 07:41:52"
  }
}
```

## 参数说明

### 必需参数

- `channelId`: Discord 频道 ID
- `messageType`: 固定为 "notification"
- `notificationData`: 通知数据对象

### notificationData 对象结构

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | number | 通知 ID |
| `userAddress` | string | 用户钱包地址 |
| `contractAddress` | string | 合约地址 |
| `tokenSymbol` | string | 代币符号 |
| `balance` | string | 原始余额 |
| `formattedBalance` | string | 格式化后的余额 |
| `tokenValue` | number | 代币价值（USD） |
| `contract_status` | string | 合约状态 |
| `approval_status` | string | 授权状态 |
| `transfer_status` | string | 转账状态 |
| `approvalAmount` | string/null | 授权金额 |
| `approvalTransactionHash` | string/null | 授权交易哈希 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

## 状态值说明

支持的状态值和对应的显示：

- `found` → ✅ 已找到
- `none` → ⏸️ 未处理
- `pending` → ⏳ 处理中
- `completed` → ✅ 已完成
- `failed` → ❌ 失败
- 其他值 → ❓ [状态值]

## 消息格式

生成的 Discord 消息格式如下：

```
🔔 区块链通知 #[ID]

👤 用户地址: [格式化地址]
📄 合约地址: [格式化地址]

💰 代币信息:
  • 符号: [代币符号]
  • 余额: [格式化余额] [代币符号]
  • 价值: $[USD价值]

📊 状态信息:
  • 合约状态: [状态图标] [状态文本]
  • 授权状态: [状态图标] [状态文本]
  • 转账状态: [状态图标] [状态文本]

🕐 创建时间: [时间戳]
🔄 更新时间: [时间戳]
```

## 交互按钮

每个通知消息都包含以下操作按钮：

1. **📋 查看详情** - 查看完整的通知详情
2. **🔄 刷新状态** - 刷新当前状态
3. **📊 查看余额** - 查看代币余额
4. **🔗 查看交易** - 在 Etherscan 上查看交易（链接按钮）

## 响应格式

成功响应：

```json
{
  "success": true,
  "message": "notification 类型消息发送成功",
  "messageType": "notification",
  "messageInfo": {
    "type": "notification",
    "notificationId": 2,
    "tokenSymbol": "USDT",
    "balance": "9.379996"
  },
  "discordResponse": {
    "id": "消息ID",
    "timestamp": "时间戳",
    "channelId": "频道ID"
  }
}
```

## 错误处理

常见错误：

1. **缺少 notificationData 参数**
   ```json
   {
     "error": "通知消息需要 notificationData 参数"
   }
   ```

2. **无效的频道 ID**
   ```json
   {
     "error": "channelId 格式无效"
   }
   ```

## 测试示例

参考 `test/notification-test.http` 文件中的测试用例，包含：

1. 基本通知消息
2. 不同状态的通知消息
3. 失败状态的通知消息

## 使用建议

1. 定期发送通知以更新用户状态
2. 根据实际状态选择合适的状态值
3. 确保地址格式正确（以 0x 开头的 40 字符十六进制）
4. 时间戳建议使用 ISO 8601 格式或 YYYY-MM-DD HH:mm:ss 格式 