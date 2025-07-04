# Discord 按钮参数传递使用示例

## 概述

我们已经为你的 Discord
机器人创建了一个完整的按钮管理系统，支持参数传递。现在你可以轻松地创建带参数的按钮，并在用户点击时获取这些参数。

## 主要功能

### 1. 按钮参数编码

- 自动将参数编码到 `custom_id` 中
- 支持复杂的 JSON 对象作为参数
- 自动处理 Discord 的 100 字符限制

### 2. 自动处理器注册

- 创建按钮时自动注册处理器
- 点击时自动解码参数并传递给处理函数
- 支持多种响应类型（私有、公开、更新等）

### 3. 预设按钮类型

- 订单操作按钮
- 产品操作按钮
- 分页按钮
- 确认/取消按钮

## 使用示例

### 基础用法

```javascript
import { buttonManager, ButtonStyle } from "./button-manager.js";

// 创建带参数的按钮
const button = buttonManager.createButton({
    label: "查看订单",
    customId: "view_order",
    params: {
        orderId: "ORDER-123",
        userId: "user456",
    },
    style: ButtonStyle.PRIMARY,
    handler: async (interaction, env, { userName, params }) => {
        const { orderId, userId } = params;
        return buttonHandler.createResponse(
            `${userName} 查看了订单 ${orderId}`,
            "ephemeral",
        );
    },
});

// 发送消息
await buttonManager.sendMessageWithButtons(
    channelId,
    "这是你的订单信息",
    [button],
    token,
);
```

### 订单管理示例

```javascript
// 创建订单按钮
const orderButtons = buttonManager.createOrderButtons({
    orderId: "ORDER-123",
    userId: "user456",
    status: "pending",
});

await buttonManager.sendMessageWithButtons(
    channelId,
    "📦 你的订单已创建",
    orderButtons,
    token,
);
```

### 产品展示示例

```javascript
// 创建产品按钮
const productButtons = buttonManager.createProductButtons({
    productId: "PROD-789",
    name: "iPhone 15",
    price: 999.99,
});

await buttonManager.sendMessageWithButtons(
    channelId,
    "🛍️ 查看产品详情",
    productButtons,
    token,
);
```

### 分页示例

```javascript
// 创建分页按钮
const pageButtons = buttonManager.createPaginationButtons({
    currentPage: 1,
    totalPages: 10,
    dataType: "products",
});

await buttonManager.sendMessageWithButtons(
    channelId,
    "📑 产品列表 (第 1 页)",
    pageButtons,
    token,
);
```

## API 端点

### 1. 发送订单按钮

```bash
POST /custom/send-order-buttons
```

请求体：

```json
{
    "channelId": "1234567890123456789",
    "orderId": "ORDER-123",
    "userId": "user456",
    "status": "pending"
}
```

### 2. 发送产品按钮

```bash
POST /custom/send-product-buttons
```

请求体：

```json
{
    "channelId": "1234567890123456789",
    "productId": "PROD-789",
    "name": "iPhone 15",
    "price": 999.99
}
```

### 3. 发送分页按钮

```bash
POST /custom/send-pagination-buttons
```

请求体：

```json
{
    "channelId": "1234567890123456789",
    "currentPage": 1,
    "totalPages": 10,
    "dataType": "products"
}
```

### 4. 发送自定义参数按钮

```bash
POST /custom/send-custom-param-buttons
```

请求体：

```json
{
    "channelId": "1234567890123456789",
    "customData": "any_data",
    "userId": "user123",
    "category": "electronics"
}
```

## 参数传递机制

### 编码过程

1. 参数对象被转换为 JSON 字符串
2. JSON 字符串被 Base64 编码
3. 编码后的字符串添加到 `custom_id` 中：`baseId|encodedParams`

### 解码过程

1. 接收到按钮点击事件
2. 从 `custom_id` 中提取 `baseId` 和编码的参数
3. Base64 解码参数
4. 将参数传递给处理函数

### 示例

```javascript
// 原始参数
const params = { orderId: "ORDER-123", userId: "user456" };

// 编码后的 custom_id
// view_order|eyJvcmRlcklkIjoiT1JERVItMTIzIiwidXNlcklkIjoidXNlcjQ1NiJ9

// 在处理函数中，params 会被自动解码并传递
handler: (async (interaction, env, { userName, params }) => {
    console.log(params); // { orderId: 'ORDER-123', userId: 'user456' }
});
```

## 最佳实践

1. **参数大小控制**：保持参数对象较小，避免超过 Discord 的 100 字符限制
2. **错误处理**：在处理函数中添加适当的错误处理
3. **用户体验**：使用适当的响应类型（private/public/update）
4. **按钮状态**：根据业务逻辑动态显示/隐藏按钮
5. **参数验证**：在处理函数中验证参数的有效性

## 故障排除

### 常见问题

1. **按钮点击无响应**
   - 检查处理器是否正确注册
   - 确认 `custom_id` 编码正确

2. **参数解码失败**
   - 检查参数对象是否可序列化
   - 确认 Base64 编码正确

3. **custom_id 太长**
   - 减少参数数量或使用更短的键名
   - 考虑使用数据库存储复杂参数

### 调试技巧

```javascript
// 在处理函数中添加调试信息
handler: (async (interaction, env, { userName, params }) => {
    console.log("Button clicked:", interaction.data.custom_id);
    console.log("Decoded params:", params);
    console.log("User:", userName);

    // 你的处理逻辑...
});
```

## 扩展功能

你可以根据需要扩展按钮管理器：

1. **添加新的按钮类型**
2. **创建自定义响应类型**
3. **实现按钮状态管理**
4. **添加权限检查**
5. **集成数据库操作**

这个系统为你提供了一个强大且灵活的按钮管理解决方案，让你可以轻松处理复杂的交互逻辑。
