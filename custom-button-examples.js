// 这是一个示例文件，展示如何添加自定义按钮处理器
// 在实际项目中，您可以在 src/button-handlers.js 中添加您的自定义处理器

import { buttonHandler, ButtonResponseType } from './src/button-handlers.js';

// 示例 1: 简单的问候按钮
buttonHandler.register('hello_button', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `👋 你好，${userName}！欢迎使用我们的 Discord Bot！`,
    ButtonResponseType.EPHEMERAL
  );
});

// 示例 2: 获取服务器信息按钮
buttonHandler.register('server_info_button', async (interaction, env, { userName }) => {
  const guildId = interaction.guild_id;
  const channelId = interaction.channel_id;
  
  return buttonHandler.createResponse(
    `🏠 服务器信息：\n` +
    `• 服务器 ID: ${guildId}\n` +
    `• 频道 ID: ${channelId}\n` +
    `• 请求用户: ${userName}`,
    ButtonResponseType.EPHEMERAL
  );
});

// 示例 3: 投票按钮（更新消息）
let voteCount = { yes: 0, no: 0 };

buttonHandler.register('vote_yes', async (interaction, env, { userName }) => {
  voteCount.yes++;
  
  // 创建新的投票按钮
  const voteButtons = [
    {
      type: 1, // ACTION_ROW
      components: [
        {
          type: 2, // BUTTON
          style: 3, // Success
          label: `✅ 赞成 (${voteCount.yes})`,
          custom_id: 'vote_yes'
        },
        {
          type: 2, // BUTTON
          style: 4, // Danger
          label: `❌ 反对 (${voteCount.no})`,
          custom_id: 'vote_no'
        }
      ]
    }
  ];
  
  return buttonHandler.createResponse(
    `📊 投票结果更新！${userName} 投了赞成票。`,
    ButtonResponseType.UPDATE,
    voteButtons
  );
});

buttonHandler.register('vote_no', async (interaction, env, { userName }) => {
  voteCount.no++;
  
  const voteButtons = [
    {
      type: 1, // ACTION_ROW
      components: [
        {
          type: 2, // BUTTON
          style: 3, // Success
          label: `✅ 赞成 (${voteCount.yes})`,
          custom_id: 'vote_yes'
        },
        {
          type: 2, // BUTTON
          style: 4, // Danger
          label: `❌ 反对 (${voteCount.no})`,
          custom_id: 'vote_no'
        }
      ]
    }
  ];
  
  return buttonHandler.createResponse(
    `📊 投票结果更新！${userName} 投了反对票。`,
    ButtonResponseType.UPDATE,
    voteButtons
  );
});

// 示例 4: 需要调用外部 API 的按钮
buttonHandler.register('weather_button', async (interaction, env, { userName }) => {
  try {
    // 这里可以调用天气 API
    // const weatherData = await fetch('https://api.weather.com/...');
    
    // 模拟天气数据
    const weatherInfo = {
      city: '北京',
      temperature: '22°C',
      condition: '晴天',
      humidity: '65%'
    };
    
    return buttonHandler.createResponse(
      `🌤️ ${userName} 查询的天气信息：\n` +
      `• 城市: ${weatherInfo.city}\n` +
      `• 温度: ${weatherInfo.temperature}\n` +
      `• 天气: ${weatherInfo.condition}\n` +
      `• 湿度: ${weatherInfo.humidity}`,
      ButtonResponseType.EPHEMERAL
    );
  } catch (error) {
    return buttonHandler.createResponse(
      `❌ ${userName}，获取天气信息失败: ${error.message}`,
      ButtonResponseType.EPHEMERAL
    );
  }
});

// 示例 5: 用户权限检查按钮
buttonHandler.register('admin_only_button', async (interaction, env, { userName, userId }) => {
  // 这里可以检查用户权限
  const adminUsers = ['123456789012345678']; // 管理员用户 ID 列表
  
  if (!adminUsers.includes(userId)) {
    return buttonHandler.createResponse(
      `🚫 ${userName}，此功能仅限管理员使用。`,
      ButtonResponseType.EPHEMERAL
    );
  }
  
  return buttonHandler.createResponse(
    `👑 ${userName}，管理员功能已激活！`,
    ButtonResponseType.EPHEMERAL
  );
});

// 示例 6: 延迟响应按钮（用于长时间处理）
buttonHandler.register('slow_process_button', async (interaction, env, { userName }) => {
  // 首先发送延迟响应
  const deferredResponse = buttonHandler.createResponse(
    '',
    ButtonResponseType.DEFERRED
  );
  
  // 在实际应用中，您需要在这里进行长时间的处理
  // 然后使用 webhook 发送最终响应
  
  setTimeout(async () => {
    // 这里需要使用 Discord 的 followup webhook 发送最终响应
    // 具体实现需要根据您的需求调整
    console.log(`${userName} 的长时间处理已完成`);
  }, 5000);
  
  return deferredResponse;
});

export default buttonHandler; 