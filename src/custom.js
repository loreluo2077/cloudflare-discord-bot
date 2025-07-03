import { AutoRouter } from 'itty-router';
import { AWW_COMMAND, INVITE_COMMAND } from './commands.js';

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
 * 发送消息到 Discord 频道
 * @param {string} channelId - Discord 频道 ID
 * @param {string} content - 消息内容
 * @param {string} token - Discord Bot Token
 * @param {Array} components - 可选的组件数组（按钮等）
 * @returns {Promise<Object>} Discord API 响应
 */
async function sendDiscordMessage(channelId, content, token, components = null) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
  
  const messageData = {
    content: content,
  };

  // 如果有组件，添加到消息数据中
  if (components && components.length > 0) {
    messageData.components = components;
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

// 发送消息到 Discord 的 API
customRouter.post('/send-message', async (request, env) => {
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

    if (!body.content) {
      return new JsonResponse(
        { error: 'content 参数是必需的' },
        { status: 400 }
      );
    }

    // 验证 channelId 格式（Discord ID 通常是 17-19 位数字）
    if (!/^\d{17,19}$/.test(body.channelId)) {
      return new JsonResponse(
        { error: 'channelId 格式无效' },
        { status: 400 }
      );
    }

    // 验证消息长度（Discord 限制为 2000 字符）
    if (body.content.length > 2000) {
      return new JsonResponse(
        { error: '消息内容不能超过 2000 个字符' },
        { status: 400 }
      );
    }

    // 发送消息
    const result = await sendDiscordMessage(
      body.channelId,
      body.content,
      env.DISCORD_TOKEN
    );

    return new JsonResponse({
      success: true,
      message: '消息发送成功',
      discordResponse: {
        id: result.id,
        timestamp: result.timestamp,
        channelId: result.channel_id,
      },
    });

  } catch (error) {
    console.error('发送 Discord 消息时出错:', error);
    return new JsonResponse(
      { 
        error: '发送消息失败',
        details: error.message 
      },
      { status: 500 }
    );
  }
});

// 获取频道信息的 API
customRouter.get('/channel/:channelId', async (request, env) => {
  try {
    if (!env.DISCORD_TOKEN) {
      return new JsonResponse(
        { error: 'DISCORD_TOKEN 环境变量未设置' },
        { status: 500 }
      );
    }

    const { channelId } = request.params;

    // 验证 channelId 格式
    if (!/^\d{17,19}$/.test(channelId)) {
      return new JsonResponse(
        { error: 'channelId 格式无效' },
        { status: 400 }
      );
    }

    const url = `https://discord.com/api/v10/channels/${channelId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bot ${env.DISCORD_TOKEN}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new JsonResponse(
          { error: '频道未找到或 Bot 无权限访问' },
          { status: 404 }
        );
      }
      throw new Error(`Discord API 错误: ${response.status} ${response.statusText}`);
    }

    const channelData = await response.json();
    
    return new JsonResponse({
      success: true,
      channel: {
        id: channelData.id,
        name: channelData.name,
        type: channelData.type,
        guildId: channelData.guild_id,
      },
    });

  } catch (error) {
    console.error('获取频道信息时出错:', error);
    return new JsonResponse(
      { 
        error: '获取频道信息失败',
        details: error.message 
      },
      { status: 500 }
    );
  }
});

// 发送带按钮的消息到 Discord 的 API
customRouter.post('/send-message-with-buttons', async (request, env) => {
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

    if (!body.content) {
      return new JsonResponse(
        { error: 'content 参数是必需的' },
        { status: 400 }
      );
    }

    if (!body.buttons || !Array.isArray(body.buttons) || body.buttons.length === 0) {
      return new JsonResponse(
        { error: 'buttons 参数是必需的，且必须是非空数组' },
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

    // 验证消息长度
    if (body.content.length > 2000) {
      return new JsonResponse(
        { error: '消息内容不能超过 2000 个字符' },
        { status: 400 }
      );
    }

    // 验证按钮数量（Discord 限制每条消息最多 25 个按钮）
    if (body.buttons.length > 25) {
      return new JsonResponse(
        { error: '按钮数量不能超过 25 个' },
        { status: 400 }
      );
    }

    // 验证按钮配置
    for (let i = 0; i < body.buttons.length; i++) {
      const button = body.buttons[i];
      
      if (!button.label || typeof button.label !== 'string') {
        return new JsonResponse(
          { error: `按钮 ${i + 1} 缺少有效的 label 字段` },
          { status: 400 }
        );
      }

      if (button.label.length > 80) {
        return new JsonResponse(
          { error: `按钮 ${i + 1} 的 label 不能超过 80 个字符` },
          { status: 400 }
        );
      }

      // 如果是链接按钮，需要 URL；否则需要 custom_id
      if (button.style === 5) { // Link button
        if (!button.url || typeof button.url !== 'string') {
          return new JsonResponse(
            { error: `链接按钮 ${i + 1} 缺少有效的 url 字段` },
            { status: 400 }
          );
        }
      } else {
        if (!button.custom_id || typeof button.custom_id !== 'string') {
          return new JsonResponse(
            { error: `按钮 ${i + 1} 缺少有效的 custom_id 字段` },
            { status: 400 }
          );
        }
        if (button.custom_id.length > 100) {
          return new JsonResponse(
            { error: `按钮 ${i + 1} 的 custom_id 不能超过 100 个字符` },
            { status: 400 }
          );
        }
      }

      // 验证按钮样式
      if (button.style && ![1, 2, 3, 4, 5].includes(button.style)) {
        return new JsonResponse(
          { error: `按钮 ${i + 1} 的 style 必须是 1-5 之间的数字` },
          { status: 400 }
        );
      }
    }

    // 创建按钮组件
    const components = createButtonComponents(body.buttons);

    // 发送带按钮的消息
    const result = await sendDiscordMessage(
      body.channelId,
      body.content,
      env.DISCORD_TOKEN,
      components
    );

    return new JsonResponse({
      success: true,
      message: '带按钮的消息发送成功',
      discordResponse: {
        id: result.id,
        timestamp: result.timestamp,
        channelId: result.channel_id,
      },
      buttonsCount: body.buttons.length,
    });

  } catch (error) {
    console.error('发送带按钮的 Discord 消息时出错:', error);
    return new JsonResponse(
      { 
        error: '发送带按钮的消息失败',
        details: error.message 
      },
      { status: 500 }
    );
  }
});

// 发送示例按钮消息的便捷端点
customRouter.post('/send-demo-buttons', async (request, env) => {
  try {
    if (!env.DISCORD_TOKEN) {
      return new JsonResponse(
        { error: 'DISCORD_TOKEN 环境变量未设置' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new JsonResponse(
        { error: '无效的 JSON 格式' },
        { status: 400 }
      );
    }

    if (!body.channelId) {
      return new JsonResponse(
        { error: 'channelId 参数是必需的' },
        { status: 400 }
      );
    }

    if (!/^\d{17,19}$/.test(body.channelId)) {
      return new JsonResponse(
        { error: 'channelId 格式无效' },
        { status: 400 }
      );
    }

    // 预设的示例按钮
    const demoButtons = [
      { label: '👍 点赞', custom_id: 'like_button', style: 3 },
      { label: '❤️ 收藏', custom_id: 'favorite_button', style: 1 },
      { label: '🔄 分享', custom_id: 'share_button', style: 2 },
      { label: '⚠️ 举报', custom_id: 'report_button', style: 4 },
      { label: '🔗 访问官网', url: 'https://discord.com', style: 5 },
      { label: '🔢 计数器', custom_id: 'counter_button', style: 1 },
      { label: '⏰ 获取时间', custom_id: 'timestamp_button', style: 2 }
    ];

    const components = createButtonComponents(demoButtons);
    const content = body.content || '🎉 这是一个带按钮的示例消息！\n\n请点击下面的按钮来测试交互功能：';

    const result = await sendDiscordMessage(
      body.channelId,
      content,
      env.DISCORD_TOKEN,
      components
    );

    return new JsonResponse({
      success: true,
      message: '示例按钮消息发送成功',
      discordResponse: {
        id: result.id,
        timestamp: result.timestamp,
        channelId: result.channel_id,
      },
      buttonsUsed: demoButtons.map(btn => ({
        label: btn.label,
        style: btn.style,
        type: btn.url ? 'link' : 'interaction'
      })),
    });

  } catch (error) {
    console.error('发送示例按钮消息时出错:', error);
    return new JsonResponse(
      { 
        error: '发送示例按钮消息失败',
        details: error.message 
      },
      { status: 500 }
    );
  }
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


export default customRouter; 