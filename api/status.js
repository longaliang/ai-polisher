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

    // 返回状态
    return res.status(200).json({
      clientId: clientId,
      clientName: client.name || clientId,
      usage: {
        used: client.used,
        limit: client.limit,
        remaining: client.limit - client.used,
        percentage: ((client.used / client.limit) * 100).toFixed(1) + '%',
        isNearLimit: (client.used / client.limit) > 0.8,
        isExhausted: client.used >= client.limit
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}
