// 管理员 API - 获取所有客户列表
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 验证管理员权限（简单版：通过 header 验证）
  const adminKey = req.headers.authorization;
  if (adminKey !== `Bearer ${process.env.ADMIN_KEY || 'admin123'}`) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    // 读取客户数据
    const dataPath = path.join(process.cwd(), 'data', 'clients.json');
    const clientsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // 从 KV 获取实际使用量
    const { createClient } = require('@vercel/kv');
    const kv = createClient({
      url: process.env.KV_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // 获取每个客户的实际使用量
    const clients = [];
    for (const [clientId, client] of Object.entries(clientsData)) {
      let used = client.used || 0;
      try {
        const stored = await kv.get(`client_usage_${clientId}`);
        if (stored !== null) {
          used = parseInt(stored) || 0;
        }
      } catch (e) {
        // KV 不可用时使用本地值
      }

      clients.push({
        id: clientId,
        name: client.name,
        email: client.email,
        apiKey: client.apiKey.substring(0, 20) + '...', // 只显示前20个字符
        limit: client.limit,
        used: used,
        remaining: client.limit - used,
        percentage: ((used / client.limit) * 100).toFixed(1) + '%',
        createdAt: client.createdAt
      });
    }

    return res.status(200).json({
      success: true,
      clients: clients
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}
