import { buttonManager, ButtonStyle } from './button-manager.js';
import { ButtonResponseType, buttonHandler } from './button-handlers.js';

/**
 * 按钮使用示例
 */
export class ButtonExamples {
  
  /**
   * 示例1: 创建简单的交互按钮
   */
  static createSimpleButtons() {
    const buttons = [
      // 点赞按钮
      buttonManager.createButton({
        label: '👍 点赞',
        customId: 'like_simple',
        style: ButtonStyle.SUCCESS,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `🎉 ${userName} 点了赞！感谢你的支持！`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }),

      // 信息按钮
      buttonManager.createButton({
        label: 'ℹ️ 获取信息',
        customId: 'info_button',
        style: ButtonStyle.PRIMARY,
        handler: async (interaction, env, { userName }) => {
          const info = `📊 系统信息:\n• 用户: ${userName}\n• 时间: ${new Date().toLocaleString('zh-CN')}\n• 服务器: Cloudflare Workers`;
          return buttonHandler.createResponse(
            info,
            ButtonResponseType.EPHEMERAL
          );
        }
      }),

      // 链接按钮
      buttonManager.createButton({
        label: '🔗 访问 Discord',
        style: ButtonStyle.LINK,
        url: 'https://discord.com'
      })
    ];

    return buttons;
  }

  /**
   * 示例2: 创建带状态的计数器按钮
   */
  static createCounterButtons() {
    let counter = 0;
    
    const buttons = [
      // 增加计数器
      buttonManager.createButton({
        label: '➕ 增加',
        customId: 'counter_plus',
        style: ButtonStyle.SUCCESS,
        handler: async (interaction, env, { userName }) => {
          counter++;
          return buttonHandler.createResponse(
            `📊 ${userName} 增加了计数器！当前计数: ${counter}`,
            ButtonResponseType.PUBLIC
          );
        }
      }),

      // 减少计数器
      buttonManager.createButton({
        label: '➖ 减少',
        customId: 'counter_minus',
        style: ButtonStyle.DANGER,
        handler: async (interaction, env, { userName }) => {
          counter--;
          return buttonHandler.createResponse(
            `📊 ${userName} 减少了计数器！当前计数: ${counter}`,
            ButtonResponseType.PUBLIC
          );
        }
      }),

      // 重置计数器
      buttonManager.createButton({
        label: '🔄 重置',
        customId: 'counter_reset',
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName }) => {
          counter = 0;
          return buttonHandler.createResponse(
            `🔄 ${userName} 重置了计数器！当前计数: ${counter}`,
            ButtonResponseType.PUBLIC
          );
        }
      })
    ];

    return buttons;
  }

  /**
   * 示例3: 创建投票按钮
   */
  static createVoteButtons() {
    const votes = { yes: 0, no: 0, voters: new Set() };
    
    const buttons = [
      // 赞成票
      buttonManager.createButton({
        label: '✅ 赞成',
        customId: 'vote_yes',
        style: ButtonStyle.SUCCESS,
        handler: async (interaction, env, { userName, userId }) => {
          if (votes.voters.has(userId)) {
            return buttonHandler.createResponse(
              `⚠️ ${userName}，你已经投过票了！`,
              ButtonResponseType.EPHEMERAL
            );
          }
          
          votes.yes++;
          votes.voters.add(userId);
          
          return buttonHandler.createResponse(
            `✅ ${userName} 投了赞成票！\n📊 当前结果: 赞成 ${votes.yes} 票，反对 ${votes.no} 票`,
            ButtonResponseType.PUBLIC
          );
        }
      }),

      // 反对票
      buttonManager.createButton({
        label: '❌ 反对',
        customId: 'vote_no',
        style: ButtonStyle.DANGER,
        handler: async (interaction, env, { userName, userId }) => {
          if (votes.voters.has(userId)) {
            return buttonHandler.createResponse(
              `⚠️ ${userName}，你已经投过票了！`,
              ButtonResponseType.EPHEMERAL
            );
          }
          
          votes.no++;
          votes.voters.add(userId);
          
          return buttonHandler.createResponse(
            `❌ ${userName} 投了反对票！\n📊 当前结果: 赞成 ${votes.yes} 票，反对 ${votes.no} 票`,
            ButtonResponseType.PUBLIC
          );
        }
      }),

      // 查看结果
      buttonManager.createButton({
        label: '📊 查看结果',
        customId: 'vote_results',
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName }) => {
          const total = votes.yes + votes.no;
          const yesPercent = total > 0 ? Math.round((votes.yes / total) * 100) : 0;
          const noPercent = total > 0 ? Math.round((votes.no / total) * 100) : 0;
          
          const results = `📊 投票结果:\n✅ 赞成: ${votes.yes} 票 (${yesPercent}%)\n❌ 反对: ${votes.no} 票 (${noPercent}%)\n👥 总参与人数: ${votes.voters.size}`;
          
          return buttonHandler.createResponse(
            results,
            ButtonResponseType.EPHEMERAL
          );
        }
      })
    ];

    return buttons;
  }

  /**
   * 示例4: 创建菜单选择按钮
   */
  static createMenuButtons() {
    const buttons = [
      // 游戏菜单
      buttonManager.createButton({
        label: '🎮 游戏',
        customId: 'menu_games',
        style: ButtonStyle.PRIMARY,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `🎮 ${userName} 进入了游戏菜单！\n• 🎯 猜数字游戏\n• 🎲 骰子游戏\n• 🃏 卡牌游戏`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }),

      // 工具菜单
      buttonManager.createButton({
        label: '🔧 工具',
        customId: 'menu_tools',
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `🔧 ${userName} 进入了工具菜单！\n• ⏰ 时间查询\n• 🌤️ 天气查询\n• 🔍 搜索功能`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }),

      // 设置菜单
      buttonManager.createButton({
        label: '⚙️ 设置',
        customId: 'menu_settings',
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `⚙️ ${userName} 进入了设置菜单！\n• 🔔 通知设置\n• 🎨 主题设置\n• 🔐 隐私设置`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }),

      // 帮助菜单
      buttonManager.createButton({
        label: '❓ 帮助',
        customId: 'menu_help',
        style: ButtonStyle.SUCCESS,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `❓ ${userName} 查看了帮助菜单！\n• 📚 使用教程\n• 🆘 联系客服\n• 📋 常见问题`,
            ButtonResponseType.EPHEMERAL
          );
        }
      })
    ];

    return buttons;
  }

  /**
   * 示例5: 创建确认删除按钮
   */
  static createDeleteConfirmButtons() {
    return buttonManager.createConfirmCancelButtons({
      confirmText: '🗑️ 确认删除',
      cancelText: '❌ 取消',
      onConfirm: async (interaction, env, { userName }) => {
        return buttonHandler.createResponse(
          `🗑️ ${userName} 确认了删除操作！内容已被删除。`,
          ButtonResponseType.UPDATE,
          [] // 移除所有按钮
        );
      },
      onCancel: async (interaction, env, { userName }) => {
        return buttonHandler.createResponse(
          `❌ ${userName} 取消了删除操作。`,
          ButtonResponseType.UPDATE,
          [] // 移除所有按钮
        );
      }
    });
  }

  /**
   * 示例6: 创建反馈按钮
   */
  static createFeedbackButtons() {
    const buttons = [
      // 好评
      buttonManager.createButton({
        label: '😊 满意',
        customId: 'feedback_good',
        style: ButtonStyle.SUCCESS,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `😊 感谢 ${userName} 的好评！我们会继续努力提供更好的服务。`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }),

      // 中评
      buttonManager.createButton({
        label: '😐 一般',
        customId: 'feedback_okay',
        style: ButtonStyle.SECONDARY,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `😐 感谢 ${userName} 的反馈！我们会努力改进服务质量。`,
            ButtonResponseType.EPHEMERAL
          );
        }
      }),

      // 差评
      buttonManager.createButton({
        label: '😞 不满意',
        customId: 'feedback_bad',
        style: ButtonStyle.DANGER,
        handler: async (interaction, env, { userName }) => {
          return buttonHandler.createResponse(
            `😞 抱歉让 ${userName} 感到不满意！我们会认真对待你的反馈并改进。`,
            ButtonResponseType.EPHEMERAL
          );
        }
      })
    ];

    return buttons;
  }

  /**
   * 发送示例按钮消息
   * @param {string} channelId - 频道ID
   * @param {string} token - Discord Bot Token
   * @param {string} exampleType - 示例类型
   */
  static async sendExampleMessage(channelId, token, exampleType = 'simple') {
    let buttons;
    let content;

    switch (exampleType) {
      case 'simple':
        buttons = ButtonExamples.createSimpleButtons();
        content = '🎉 这是一个简单的按钮示例！点击下面的按钮来测试：';
        break;
      case 'counter':
        buttons = ButtonExamples.createCounterButtons();
        content = '🔢 这是一个计数器示例！点击按钮来增加、减少或重置计数：';
        break;
      case 'vote':
        buttons = ButtonExamples.createVoteButtons();
        content = '🗳️ 这是一个投票示例！请投出你的一票：';
        break;
      case 'menu':
        buttons = ButtonExamples.createMenuButtons();
        content = '📋 这是一个菜单示例！选择你想要的功能：';
        break;
      case 'delete':
        buttons = ButtonExamples.createDeleteConfirmButtons();
        content = '⚠️ 这是一个删除确认示例！确定要删除吗？';
        break;
      case 'feedback':
        buttons = ButtonExamples.createFeedbackButtons();
        content = '💬 这是一个反馈示例！请对我们的服务进行评价：';
        break;
      case 'common':
        buttons = buttonManager.createCommonButtons();
        content = '⭐ 这是一个常用按钮示例！包含点赞、收藏、分享等功能：';
        break;
      default:
        throw new Error(`未知的示例类型: ${exampleType}`);
    }

    return await buttonManager.sendMessageWithButtons(channelId, content, buttons, token);
  }
}

export default ButtonExamples; 