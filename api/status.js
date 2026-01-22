// 查询客户额度状态
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId } = req.query;

  // 验证参数
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

    const remaining = client.limit - used;

    // 返回状态
    return res.status(200).json({
      clientId: clientId,
      clientName: client.name || clientId,
      usage: {
        used: used,
        limit: client.limit,
        remaining: remaining,
        percentage: ((used / client.limit) * 100).toFixed(1) + '%',
        isNearLimit: (used / client.limit) > 0.8,
        isExhausted: used >= client.limit
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}
