/**
 * Discord Bot API 测试工具
 * 
 * 使用方法：
 * 1. 修改 BASE_URL 为您的 Worker 地址
 * 2. 修改 CHANNEL_ID 为您的 Discord 频道 ID
 * 3. 运行测试函数
 * 
 * 在浏览器控制台或 Node.js 环境中运行
 */

// 配置区域 - 请修改为您的实际值
const BASE_URL = 'https://discord-bot.loreluo2077.workers.dev';
const CHANNEL_ID = '1389779490191966389'; // 替换为您的频道 ID

// 工具函数
async function makeRequest(url, options = {}) {
    try {
        console.log(`🚀 发送请求到: ${url}`);
        console.log('📤 请求选项:', options);
        
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        console.log(`📡 响应状态: ${response.status}`);
        console.log('📥 响应数据:', data);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status} - ${data.error || '未知错误'}`);
        }
        
        return data;
    } catch (error) {
        console.error('❌ 请求失败:', error);
        throw error;
    }
}

// 测试函数

/**
 * 测试发送普通消息
 */
async function testSendMessage() {
    console.log('\n=== 测试发送普通消息 ===');
    
    const url = `${BASE_URL}/custom/send-message`;
    const data = {
        channelId: CHANNEL_ID,
        content: '你好！这是来自 API 测试的普通消息 👋'
    };
    
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * 测试发送带按钮的消息
 */
async function testSendMessageWithButtons() {
    console.log('\n=== 测试发送带按钮的消息 ===');
    
    const url = `${BASE_URL}/custom/send-message-with-buttons`;
    const data = {
        channelId: CHANNEL_ID,
        content: '请选择您的操作：',
        buttons: [
            {
                label: '✅ 确认',
                custom_id: 'confirm_action',
                style: 3
            },
            {
                label: '❌ 取消',
                custom_id: 'cancel_action',
                style: 4
            },
            {
                label: '📖 查看文档',
                url: 'https://discord.com/developers/docs',
                style: 5
            }
        ]
    };
    
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * 测试发送示例按钮消息
 */
async function testSendDemoButtons() {
    console.log('\n=== 测试发送示例按钮消息 ===');
    
    const url = `${BASE_URL}/custom/send-demo-buttons`;
    const data = {
        channelId: CHANNEL_ID,
        content: '这是我的自定义测试消息！🎉'
    };
    
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * 测试获取频道信息
 */
async function testGetChannelInfo() {
    console.log('\n=== 测试获取频道信息 ===');
    
    const url = `${BASE_URL}/custom/channel/${CHANNEL_ID}`;
    
    return await makeRequest(url, {
        method: 'GET'
    });
}

/**
 * 测试获取API文档
 */
async function testGetApiDocs() {
    console.log('\n=== 测试获取API文档 ===');
    
    const url = `${BASE_URL}/custom/docs`;
    
    return await makeRequest(url, {
        method: 'GET'
    });
}

/**
 * 测试发送投票消息
 */
async function testSendVoteMessage() {
    console.log('\n=== 测试发送投票消息 ===');
    
    const url = `${BASE_URL}/custom/send-message-with-buttons`;
    const data = {
        channelId: CHANNEL_ID,
        content: '📊 请投票选择：今晚吃什么？',
        buttons: [
            {
                label: '🍕 披萨',
                custom_id: 'vote_pizza',
                style: 1
            },
            {
                label: '🍔 汉堡',
                custom_id: 'vote_burger',
                style: 1
            },
            {
                label: '🍜 面条',
                custom_id: 'vote_noodles',
                style: 1
            },
            {
                label: '🍗 炸鸡',
                custom_id: 'vote_chicken',
                style: 1
            }
        ]
    };
    
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * 测试发送多行按钮消息
 */
async function testSendMultiRowButtons() {
    console.log('\n=== 测试发送多行按钮消息 ===');
    
    const url = `${BASE_URL}/custom/send-message-with-buttons`;
    const data = {
        channelId: CHANNEL_ID,
        content: '🎮 选择您的游戏偏好：',
        buttons: [
            // 第一行 - 游戏类型
            {
                label: '🎯 动作游戏',
                custom_id: 'game_action',
                style: 1
            },
            {
                label: '🧩 益智游戏',
                custom_id: 'game_puzzle',
                style: 1
            },
            {
                label: '🏁 竞速游戏',
                custom_id: 'game_racing',
                style: 1
            },
            // 第二行 - 操作按钮
            {
                label: '👍 点赞',
                custom_id: 'like_button',
                style: 3
            },
            {
                label: '❤️ 收藏',
                custom_id: 'favorite_button',
                style: 2
            },
            {
                label: '🔄 分享',
                custom_id: 'share_button',
                style: 2
            }
        ]
    };
    
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('🧪 开始运行所有测试...\n');
    
    const tests = [
        { name: '发送普通消息', func: testSendMessage },
        { name: '发送带按钮的消息', func: testSendMessageWithButtons },
        { name: '发送示例按钮消息', func: testSendDemoButtons },
        { name: '获取频道信息', func: testGetChannelInfo },
        { name: '获取API文档', func: testGetApiDocs },
        { name: '发送投票消息', func: testSendVoteMessage },
        { name: '发送多行按钮消息', func: testSendMultiRowButtons }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`\n🔄 正在执行: ${test.name}`);
            const result = await test.func();
            results.push({ name: test.name, status: 'success', result });
            console.log(`✅ ${test.name} - 成功`);
            
            // 在测试之间添加延迟，避免频率限制
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            results.push({ name: test.name, status: 'error', error: error.message });
            console.log(`❌ ${test.name} - 失败: ${error.message}`);
        }
    }
    
    // 输出测试总结
    console.log('\n📊 测试结果总结:');
    results.forEach(result => {
        const status = result.status === 'success' ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.status}`);
        if (result.error) {
            console.log(`   错误: ${result.error}`);
        }
    });
    
    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\n🎯 总计: ${successCount}/${results.length} 测试通过`);
    
    return results;
}

testSendMessage()

