import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';

/**
 * 处理按钮交互的响应类型
 */
export const ButtonResponseType = {
  EPHEMERAL: 'ephemeral',      // 只有点击者能看到的响应
  PUBLIC: 'public',            // 所有人都能看到的响应
  UPDATE: 'update',            // 更新原消息
  DEFERRED: 'deferred',        // 延迟响应
};

/**
 * 按钮处理器类
 */
export class ButtonHandler {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * 注册按钮处理器
   * @param {string} customId - 按钮的 custom_id
   * @param {Function} handler - 处理函数
   */
  register(customId, handler) {
    this.handlers.set(customId, handler);
  }

  /**
   * 处理按钮交互
   * @param {Object} interaction - Discord 交互对象
   * @param {Object} env - 环境变量
   * @returns {Object} Discord 响应对象
   */
  async handle(interaction, env) {
    const customId = interaction.data.custom_id;
    const user = interaction.member?.user || interaction.user;
    const userName = user?.username || '未知用户';
    const userId = user?.id || 'unknown';

    // 获取处理器
    const handler = this.handlers.get(customId);
    
    if (handler) {
      try {
        return await handler(interaction, env, { userName, userId });
      } catch (error) {
        console.error(`处理按钮 ${customId} 时出错:`, error);
        return this.createErrorResponse(userName, customId, error.message);
      }
    }

    // 默认处理器
    return this.createDefaultResponse(userName, customId);
  }

  /**
   * 创建响应对象
   * @param {string} content - 响应内容
   * @param {string} type - 响应类型
   * @param {Array} components - 组件数组
   * @returns {Object} Discord 响应对象
   */
  createResponse(content, type = ButtonResponseType.EPHEMERAL, components = null) {
    const responseData = { content };
    
    if (components !== null) {
      responseData.components = components;
    }

    switch (type) {
      case ButtonResponseType.EPHEMERAL:
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            ...responseData,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        };
      case ButtonResponseType.PUBLIC:
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: responseData,
        };
      case ButtonResponseType.UPDATE:
        return {
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: responseData,
        };
      case ButtonResponseType.DEFERRED:
        return {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        };
      default:
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            ...responseData,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        };
    }
  }

  /**
   * 创建默认响应
   */
  createDefaultResponse(userName, customId) {
    return this.createResponse(
      `🤔 ${userName} 点击了按钮: ${customId}`,
      ButtonResponseType.EPHEMERAL
    );
  }

  /**
   * 创建错误响应
   */
  createErrorResponse(userName, customId, errorMessage) {
    return this.createResponse(
      `❌ 处理按钮 ${customId} 时出错: ${errorMessage}`,
      ButtonResponseType.EPHEMERAL
    );
  }
}

// 创建全局按钮处理器实例
export const buttonHandler = new ButtonHandler();

// 注册预设的按钮处理器
buttonHandler.register('like_button', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `👍 ${userName} 点了赞！`,
    ButtonResponseType.EPHEMERAL
  );
});

buttonHandler.register('favorite_button', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `❤️ ${userName} 收藏了这条消息！`,
    ButtonResponseType.EPHEMERAL
  );
});

buttonHandler.register('share_button', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `🔄 ${userName} 想要分享这条消息！`,
    ButtonResponseType.EPHEMERAL
  );
});

buttonHandler.register('report_button', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `⚠️ ${userName} 举报了这条消息，管理员将会处理。`,
    ButtonResponseType.EPHEMERAL
  );
});

buttonHandler.register('confirm_action', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `✅ ${userName} 确认了操作！`,
    ButtonResponseType.UPDATE,
    [] // 移除按钮
  );
});

buttonHandler.register('cancel_action', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `❌ ${userName} 取消了操作。`,
    ButtonResponseType.UPDATE,
    [] // 移除按钮
  );
});

buttonHandler.register('agree', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `✅ ${userName} 同意了！`,
    ButtonResponseType.EPHEMERAL
  );
});

buttonHandler.register('decline', async (interaction, env, { userName }) => {
  return buttonHandler.createResponse(
    `❌ ${userName} 拒绝了。`,
    ButtonResponseType.EPHEMERAL
  );
});

// 添加一个计数器按钮示例
let clickCount = 0;
buttonHandler.register('counter_button', async (interaction, env, { userName }) => {
  clickCount++;
  return buttonHandler.createResponse(
    `🔢 ${userName} 点击了计数器！当前计数: ${clickCount}`,
    ButtonResponseType.PUBLIC
  );
});

// 添加一个时间戳按钮示例
buttonHandler.register('timestamp_button', async (interaction, env, { userName }) => {
  const now = new Date().toLocaleString('zh-CN');
  return buttonHandler.createResponse(
    `⏰ ${userName} 获取了当前时间: ${now}`,
    ButtonResponseType.EPHEMERAL
  );
});

export default buttonHandler; 