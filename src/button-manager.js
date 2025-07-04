import { buttonHandler, ButtonResponseType } from './button-handlers.js';

/**
 * 按钮样式枚举
 */
export const ButtonStyle = {
  PRIMARY: 1,    // 蓝色
  SECONDARY: 2,  // 灰色
  SUCCESS: 3,    // 绿色
  DANGER: 4,     // 红色
  LINK: 5,       // 链接按钮
};

/**
 * 按钮参数编码器
 */
export class ButtonParamEncoder {
  /**
   * 将参数编码到custom_id中
   * @param {string} baseId - 基础ID
   * @param {Object} params - 参数对象
   * @returns {string} 编码后的custom_id
   */
  static encode(baseId, params = {}) {
    if (!params || Object.keys(params).length === 0) {
      return baseId;
    }
    
    // 将参数转换为JSON字符串并进行Base64编码
    const paramsJson = JSON.stringify(params);
    const encodedParams = btoa(paramsJson);
    
    // Discord custom_id 最大长度为 100 字符
    const customId = `${baseId}|${encodedParams}`;
    
    if (customId.length > 100) {
      throw new Error(`按钮 custom_id 太长 (${customId.length} > 100 字符)，请减少参数数量或长度`);
    }
    
    return customId;
  }

  /**
   * 从custom_id中解码参数
   * @param {string} customId - 编码的custom_id
   * @returns {Object} 解码结果 { baseId, params }
   */
  static decode(customId) {
    if (!customId.includes('|')) {
      return { baseId: customId, params: {} };
    }
    
    const [baseId, encodedParams] = customId.split('|', 2);
    
    try {
      const paramsJson = atob(encodedParams);
      const params = JSON.parse(paramsJson);
      return { baseId, params };
    } catch (error) {
      console.error('解码按钮参数时出错:', error);
      return { baseId: customId, params: {} };
    }
  }
}

/**
 * 按钮管理器 - 提供更便捷的按钮创建和处理方法
 */
export class ButtonManager {
  constructor() {
    this.buttonConfigs = new Map();
    this.dynamicHandlers = new Map();
    this.paramHandlers = new Map(); // 存储带参数的处理器
  }

  /**
   * 创建一个按钮配置对象
   * @param {Object} config - 按钮配置
   * @param {string} config.label - 按钮标签
   * @param {string} config.customId - 按钮自定义ID
   * @param {Object} config.params - 按钮参数对象
   * @param {number} config.style - 按钮样式
   * @param {Function} config.handler - 按钮处理函数
   * @param {boolean} config.disabled - 是否禁用
   * @param {Object} config.emoji - 表情符号
   * @param {string} config.url - 链接URL（仅限链接按钮）
   * @returns {Object} 按钮配置对象
   */
  createButton(config) {
    const {
      label,
      customId,
      params = {},
      style = ButtonStyle.PRIMARY,
      handler,
      disabled = false,
      emoji = null,
      url = null
    } = config;

    // 验证必需参数
    if (!label) {
      throw new Error('按钮标签 (label) 是必需的');
    }

    // 对于非链接按钮，customId 和 handler 是必需的
    if (style !== ButtonStyle.LINK) {
      if (!customId) {
        throw new Error('按钮自定义ID (customId) 是必需的');
      }
      if (!handler || typeof handler !== 'function') {
        throw new Error('按钮处理函数 (handler) 是必需的');
      }
    }

    // 如果是链接按钮，url 是必需的
    if (style === ButtonStyle.LINK && !url) {
      throw new Error('链接按钮需要提供 url 参数');
    }

    // 编码参数到 custom_id
    let encodedCustomId = customId;
    if (customId && Object.keys(params).length > 0) {
      encodedCustomId = ButtonParamEncoder.encode(customId, params);
    }

    // 存储按钮配置
    const buttonConfig = {
      label,
      custom_id: encodedCustomId,
      baseCustomId: customId, // 保存原始的customId
      params,
      style,
      disabled,
      emoji,
      url,
      handler
    };

    // 如果有处理函数，注册到按钮处理器
    if (handler && customId) {
      this.registerParamHandler(customId, handler);
      this.buttonConfigs.set(encodedCustomId, buttonConfig);
    }

    return buttonConfig;
  }

  /**
   * 注册带参数的按钮处理器
   * @param {string} baseCustomId - 基础自定义ID
   * @param {Function} handler - 处理函数
   */
  registerParamHandler(baseCustomId, handler) {
    this.paramHandlers.set(baseCustomId, handler);
    
    // 创建一个包装器处理器，用于解析参数
    const wrappedHandler = async (interaction, env, userInfo) => {
      const { baseId, params } = ButtonParamEncoder.decode(interaction.data.custom_id);
      
      // 将参数添加到用户信息中
      const enhancedUserInfo = { ...userInfo, params };
      
      // 调用原始处理器
      return await handler(interaction, env, enhancedUserInfo);
    };
    
    // 注册到全局按钮处理器 - 使用原始baseCustomId作为key
    // 在实际处理时，buttonHandler会通过custom_id找到对应的处理器
    // 我们需要确保能够处理任何以baseCustomId开头的custom_id
    buttonHandler.register(baseCustomId, wrappedHandler);
    this.dynamicHandlers.set(baseCustomId, wrappedHandler);
  }

  /**
   * 注册按钮处理器
   * @param {string} customId - 按钮自定义ID
   * @param {Function} handler - 处理函数
   */
  registerHandler(customId, handler) {
    buttonHandler.register(customId, handler);
    this.dynamicHandlers.set(customId, handler);
  }

  /**
   * 创建按钮组件数组
   * @param {Array} buttons - 按钮配置数组
   * @returns {Array} Discord 组件数组
   */
  createButtonComponents(buttons) {
    const components = [];
    
    // Discord 每行最多 5 个按钮
    for (let i = 0; i < buttons.length; i += 5) {
      const row = {
        type: 1, // ACTION_ROW
        components: buttons.slice(i, i + 5).map(button => {
          const component = {
            type: 2, // BUTTON
            style: button.style || ButtonStyle.PRIMARY,
            label: button.label,
            disabled: button.disabled || false,
          };

          // 添加可选属性
          if (button.custom_id) component.custom_id = button.custom_id;
          if (button.emoji) component.emoji = button.emoji;
          if (button.url) component.url = button.url;

          return component;
        })
      };
      components.push(row);
    }
    
    return components;
  }

  /**
   * 发送带按钮的消息到 Discord
   * @param {string} channelId - 频道ID
   * @param {string} content - 消息内容
   * @param {Array} buttons - 按钮配置数组
   * @param {string} token - Discord Bot Token
   * @returns {Promise<Object>} Discord API 响应
   */
  async sendMessageWithButtons(channelId, content, buttons, token) {
    // 创建按钮组件
    const components = this.createButtonComponents(buttons);
    
    // 发送消息
    const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
    
    const messageData = {
      content: content,
      components: components,
    };
    
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
   * 创建订单操作按钮
   * @param {Object} orderInfo - 订单信息
   * @param {string} orderInfo.orderId - 订单ID
   * @param {string} orderInfo.userId - 用户ID
   * @param {string} orderInfo.status - 订单状态
   * @returns {Array} 按钮配置数组
   */
  createOrderButtons(orderInfo) {
    const { orderId, userId, status } = orderInfo;
    
    const buttons = [];

    // 查看订单详情按钮
    buttons.push(this.createButton({
      label: '📋 查看详情',
      customId: 'order_details',
      params: { orderId, userId },
      style: ButtonStyle.PRIMARY,
      handler: async (interaction, env, { userName, params }) => {
        const { orderId, userId } = params;
        return buttonHandler.createResponse(
          `📋 ${userName} 查看了订单详情：\n• 订单ID: ${orderId}\n• 用户ID: ${userId}\n• 状态: ${status}`,
          ButtonResponseType.EPHEMERAL
        );
      }
    }));

    // 确认收货按钮（仅未完成订单显示）
    if (status !== 'completed') {
      buttons.push(this.createButton({
        label: '✅ 确认收货',
        customId: 'order_confirm',
        params: { orderId, userId },
        style: ButtonStyle.SUCCESS,
        handler: async (interaction, env, { userName, params }) => {
          const { orderId, userId } = params;
          return buttonHandler.createResponse(
            `✅ ${userName} 确认收货了订单 ${orderId}！`,
            ButtonResponseType.UPDATE,
            [] // 移除按钮
          );
        }
      }));
    }

    // 申请退款按钮（仅未完成订单显示）
    if (status !== 'completed' && status !== 'refunded') {
      buttons.push(this.createButton({
        label: '🔄 申请退款',
        customId: 'order_refund',
        params: { orderId, userId },
        style: ButtonStyle.DANGER,
        handler: async (interaction, env, { userName, params }) => {
          const { orderId, userId } = params;
          return buttonHandler.createResponse(
            `🔄 ${userName} 申请了订单 ${orderId} 的退款，请等待处理！`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }));
    }

    return buttons;
  }

  /**
   * 创建产品操作按钮
   * @param {Object} productInfo - 产品信息
   * @param {string} productInfo.productId - 产品ID
   * @param {string} productInfo.name - 产品名称
   * @param {number} productInfo.price - 产品价格
   * @returns {Array} 按钮配置数组
   */
  createProductButtons(productInfo) {
    const { productId, name, price } = productInfo;
    
    const buttons = [];

    // 添加到购物车按钮
    buttons.push(this.createButton({
      label: '🛒 加入购物车',
      customId: 'add_to_cart',
      params: { productId, name, price },
      style: ButtonStyle.PRIMARY,
      handler: async (interaction, env, { userName, params }) => {
        const { productId, name, price } = params;
        return buttonHandler.createResponse(
          `🛒 ${userName} 将 "${name}" (ID: ${productId}, 价格: ¥${price}) 加入了购物车！`,
          ButtonResponseType.EPHEMERAL
        );
      }
    }));

    // 立即购买按钮
    buttons.push(this.createButton({
      label: '💳 立即购买',
      customId: 'buy_now',
      params: { productId, name, price },
      style: ButtonStyle.SUCCESS,
      handler: async (interaction, env, { userName, params }) => {
        const { productId, name, price } = params;
        return buttonHandler.createResponse(
          `💳 ${userName} 立即购买了 "${name}" (ID: ${productId}, 价格: ¥${price})！`,
          ButtonResponseType.EPHEMERAL
        );
      }
    }));

    // 收藏按钮
    buttons.push(this.createButton({
      label: '⭐ 收藏',
      customId: 'favorite_product',
      params: { productId, name },
      style: ButtonStyle.SECONDARY,
      handler: async (interaction, env, { userName, params }) => {
        const { productId, name } = params;
        return buttonHandler.createResponse(
          `⭐ ${userName} 收藏了产品 "${name}" (ID: ${productId})！`,
          ButtonResponseType.EPHEMERAL
        );
      }
    }));

    return buttons;
  }

  /**
   * 创建分页按钮
   * @param {Object} pageInfo - 分页信息
   * @param {number} pageInfo.currentPage - 当前页
   * @param {number} pageInfo.totalPages - 总页数
   * @param {string} pageInfo.dataType - 数据类型
   * @returns {Array} 按钮配置数组
   */
  createPaginationButtons(pageInfo) {
    const { currentPage, totalPages, dataType } = pageInfo;
    
    const buttons = [];

    // 上一页按钮
    if (currentPage > 1) {
      buttons.push(this.createButton({
        label: '⬅️ 上一页',
        customId: 'page_prev',
        params: { page: currentPage - 1, dataType },
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName, params }) => {
          const { page, dataType } = params;
          return buttonHandler.createResponse(
            `⬅️ ${userName} 切换到了第 ${page} 页 (${dataType})`,
            ButtonResponseType.UPDATE
          );
        }
      }));
    }

    // 页码显示
    buttons.push(this.createButton({
      label: `${currentPage} / ${totalPages}`,
      customId: 'page_info',
      params: { currentPage, totalPages, dataType },
      style: ButtonStyle.PRIMARY,
      disabled: true,
      handler: async (interaction, env, { userName, params }) => {
        // 禁用按钮不会触发，但为了完整性保留
        return buttonHandler.createResponse(
          `📄 当前页: ${params.currentPage} / ${params.totalPages}`,
          ButtonResponseType.EPHEMERAL
        );
      }
    }));

    // 下一页按钮
    if (currentPage < totalPages) {
      buttons.push(this.createButton({
        label: '➡️ 下一页',
        customId: 'page_next',
        params: { page: currentPage + 1, dataType },
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName, params }) => {
          const { page, dataType } = params;
          return buttonHandler.createResponse(
            `➡️ ${userName} 切换到了第 ${page} 页 (${dataType})`,
            ButtonResponseType.UPDATE
          );
        }
      }));
    }

    return buttons;
  }

  /**
   * 创建一组预设的常用按钮
   * @param {Object} options - 选项
   * @returns {Array} 按钮配置数组
   */
  createCommonButtons(options = {}) {
    const buttons = [];

    // 点赞按钮
    if (options.like !== false) {
      buttons.push(this.createButton({
        label: '👍 点赞',
        customId: 'like_button',
        style: ButtonStyle.SUCCESS,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `👍 ${userName} 点了赞！`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }));
    }

    // 收藏按钮
    if (options.favorite !== false) {
      buttons.push(this.createButton({
        label: '❤️ 收藏',
        customId: 'favorite_button',
        style: ButtonStyle.PRIMARY,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `❤️ ${userName} 收藏了这条消息！`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }));
    }

    // 分享按钮
    if (options.share !== false) {
      buttons.push(this.createButton({
        label: '🔄 分享',
        customId: 'share_button',
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `🔄 ${userName} 想要分享这条消息！`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }));
    }

    // 举报按钮
    if (options.report !== false) {
      buttons.push(this.createButton({
        label: '⚠️ 举报',
        customId: 'report_button',
        style: ButtonStyle.DANGER,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `⚠️ ${userName} 举报了这条消息，管理员将会处理。`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }));
    }

    return buttons;
  }

  /**
   * 创建确认/取消按钮组合
   * @param {Object} options - 选项
   * @param {Function} options.onConfirm - 确认处理函数
   * @param {Function} options.onCancel - 取消处理函数
   * @param {string} options.confirmText - 确认按钮文本
   * @param {string} options.cancelText - 取消按钮文本
   * @param {Object} options.params - 传递给处理函数的参数
   * @returns {Array} 按钮配置数组
   */
  createConfirmCancelButtons(options = {}) {
    const {
      onConfirm,
      onCancel,
      confirmText = '✅ 确认',
      cancelText = '❌ 取消',
      params = {}
    } = options;

    const buttons = [];

    // 确认按钮
    buttons.push(this.createButton({
      label: confirmText,
      customId: 'confirm_action',
      params,
      style: ButtonStyle.SUCCESS,
      handler: onConfirm || (async (interaction, env, { userName, params }) => {
        return buttonHandler.createResponse(
          `✅ ${userName} 确认了操作！${params ? ` 参数: ${JSON.stringify(params)}` : ''}`,
          ButtonResponseType.UPDATE,
          [] // 移除按钮
        );
      })
    }));

    // 取消按钮
    buttons.push(this.createButton({
      label: cancelText,
      customId: 'cancel_action',
      params,
      style: ButtonStyle.DANGER,
      handler: onCancel || (async (interaction, env, { userName, params }) => {
        return buttonHandler.createResponse(
          `❌ ${userName} 取消了操作。${params ? ` 参数: ${JSON.stringify(params)}` : ''}`,
          ButtonResponseType.UPDATE,
          [] // 移除按钮
        );
      })
    }));

    return buttons;
  }

  /**
   * 获取已注册的按钮配置
   * @param {string} customId - 按钮自定义ID
   * @returns {Object|null} 按钮配置
   */
  getButtonConfig(customId) {
    return this.buttonConfigs.get(customId) || null;
  }

  /**
   * 获取所有已注册的按钮
   * @returns {Array} 按钮配置数组
   */
  getAllButtons() {
    return Array.from(this.buttonConfigs.values());
  }

  /**
   * 清理动态注册的处理器
   */
  cleanup() {
    this.dynamicHandlers.clear();
    this.buttonConfigs.clear();
    this.paramHandlers.clear();
  }
}

// 创建全局按钮管理器实例
export const buttonManager = new ButtonManager();

export default buttonManager; 