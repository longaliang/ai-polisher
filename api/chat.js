// AI文章润色 API
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
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

    // 检查额度
    if (client.used >= client.limit) {
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

    // 更新客户额度
    client.used += tokensUsed;

    // 保存回文件
    fs.writeFileSync(dataPath, JSON.stringify(clientsData, null, 2));

    // 返回结果
    return res.status(200).json({
      success: true,
      polishedText: result.choices[0].message.content,
      tokensUsed: tokensUsed,
      remaining: client.limit - client.used,
      usage: {
        used: client.used,
        limit: client.limit,
        percentage: ((client.used / client.limit) * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}
