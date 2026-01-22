// 管理员 API - 更新客户限额
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 验证管理员权限
  const authHeader = req.headers.authorization || '';
  const expectedKey = `Bearer ${process.env.ADMIN_KEY || 'admin123'}`;

  if (authHeader !== expectedKey) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const { clientId, action, limit } = req.body;

  if (!clientId) {
    return res.status(400).json({ error: '缺少客户ID' });
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
    let newUsed = client.used || 0;

    // 执行操作
    if (action === 'update_limit' && limit !== undefined) {
      client.limit = parseInt(limit);
    }

    if (action === 'reset_usage') {
      // 重置 KV 中的使用量
      try {
        const { createClient } = require('@vercel/kv');
        const kv = createClient({
          url: process.env.KV_URL,
          token: process.env.KV_REST_API_TOKEN,
        });
        await kv.set(`client_usage_${clientId}`, '0');
        newUsed = 0;
      } catch (e) {
        console.log('KV reset failed:', e.message);
        newUsed = 0;
      }
    }

    return res.status(200).json({
      success: true,
      message: '操作成功',
      client: {
        id: clientId,
        name: client.name,
        limit: client.limit,
        used: newUsed
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}
