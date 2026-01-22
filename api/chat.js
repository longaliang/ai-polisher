// AI文章润色 API
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, text, style = 'professional' } = req.body;

  // 验证参数
  if (!clientId || !text) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 读取客户数据
    const dataPath = path.join(process.cwd(), 'data', 'clients.json');
    const clientsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // 检查客户是否存在
    if (!clientsData[clientId]) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const client = clientsData[clientId];

    // 从 Vercel KV 获取已使用量
    let used = client.used || 0;
    try {
      const { createClient } = require('@vercel/kv');
      const kv = createClient({
        url: process.env.KV_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      const stored = await kv.get(`client_usage_${clientId}`);
      if (stored !== null) {
        used = parseInt(stored) || 0;
      }
    } catch (kvError) {
      // KV 不可用时，使用本地值
      console.log('KV not available, using local value');
    }

    // 检查额度
    if (used >= client.limit) {
      return res.status(403).json({ error: '额度已用完，请联系管理员' });
    }

    // 调用智谱 AI
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client.apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的文章润色专家。请根据用户选择的风格对文章进行润色。

可选风格：
- professional: 专业正式，适合商务文档、学术论文
- casual: 轻松自然，适合博客、社交媒体
- concise: 简洁明了，突出重点
- creative: 创意生动，吸引眼球

请只返回润色后的文章，不要解释。`
          },
          {
            role: 'user',
            content: `请将以下文章润色为${style}风格：\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ error: 'AI服务错误: ' + JSON.stringify(error) });
    }

    const result = await response.json();

    // 获取token消耗量
    const tokensUsed = result.usage?.total_tokens || 0;
    const newUsed = used + tokensUsed;

    // 更新 Vercel KV
    try {
      const { createClient } = require('@vercel/kv');
      const kv = createClient({
        url: process.env.KV_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      await kv.set(`client_usage_${clientId}`, newUsed.toString());
    } catch (kvError) {
      console.log('KV update failed:', kvError.message);
    }

    // 返回结果
    return res.status(200).json({
      success: true,
      polishedText: result.choices[0].message.content,
      tokensUsed: tokensUsed,
      remaining: client.limit - newUsed,
      usage: {
        used: newUsed,
        limit: client.limit,
        percentage: ((newUsed / client.limit) * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}
