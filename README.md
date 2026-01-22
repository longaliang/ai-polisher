# AI文章润色器 - 部署文档

## 📋 项目简介

一个基于 AI 的文章润色工具，支持多客户独立 API 计费和额度管理。

- 每个客户使用独立的智谱 API Key
- 实时显示 token 消耗和剩余额度
- 支持多种润色风格（专业、轻松、简洁、创意）
- 部署在 Vercel，无需服务器

---

## 🚀 快速部署

### 步骤 1：注册账号

1. **Vercel**：访问 https://vercel.com 注册
2. **智谱 AI**：访问 https://open.bigmodel.cn 注册并创建 API Key

---

### 步骤 2：准备代码

#### 方式 A：通过 Git（推荐）

```bash
# 如果项目是 git 仓库
cd "e:/english study/ai-polisher"
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
# 然后在 Vercel 导入该仓库
```

#### 方式 B：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd "e:/english study/ai-polisher"

# 登录并部署
vercel login
vercel
```

---

### 步骤 3：配置客户数据

编辑 `data/clients.json`，替换为真实信息：

```json
{
  "客户ID": {
    "name": "客户名称",
    "apiKey": "客户的智谱API Key",
    "used": 0,
    "limit": 100000,
    "email": "客户邮箱",
    "createdAt": "2026-01-22"
  }
}
```

**重要**：
- `客户ID`：唯一标识，用于 URL 参数，如 `?client=客户ID`
- `apiKey`：从智谱后台获取
- `limit`：token 额度限制

---

### 步骤 4：部署到 Vercel

#### 通过 Vercel 网站部署：

1. 登录 https://vercel.com
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库或上传文件夹
4. 点击 "Deploy"

#### 通过 Vercel CLI 部署：

```bash
vercel --prod
```

---

### 步骤 5：获取部署地址

部署完成后，Vercel 会提供一个地址，例如：
```
https://ai-polisher.vercel.app
```

---

## 📱 客户使用方式

### 访问地址

```
https://你的域名.vercel.app?client=客户ID
```

例如：
```
https://ai-polisher.vercel.app?client=demo_client
```

### 分配给客户

1. 在 `clients.json` 中添加客户信息
2. 生成专属链接：`?client=客户ID`
3. 将链接发送给客户

---

## 🛠️ 管理后台操作

### 添加新客户

编辑 `data/clients.json`，添加：

```json
"新客户ID": {
  "name": "新客户名称",
  "apiKey": "新客户的API Key",
  "used": 0,
  "limit": 50000,
  "email": "new@example.com",
  "createdAt": "2026-01-22"
}
```

### 调整客户额度

编辑 `data/clients.json`，修改 `limit` 字段。

### 重置客户使用量

将 `used` 设置为 `0`。

---

## 💰 成本说明

| 项目 | 费用 |
|------|------|
| Vercel 托管 | 免费版足够用 |
| 智谱 AI API | 按 token 计费，glm-4-flash 很便宜 |
| 域名（可选） | 按需购买 |

---

## 🔒 安全建议

1. **不要将 `clients.json` 提交到公开仓库**
   - 在 `.gitignore` 中添加 `data/clients.json`
   - 在 Vercel 环境变量中存储敏感信息

2. **设置访问密码**（可选）
   - 在 API 中添加密码验证
   - 防止未授权访问

---

## 📊 监控和维护

### Vercel 后台

- 查看访问日志
- 监控 API 调用次数
- 查看错误信息

### 客户额度管理

定期检查 `data/clients.json`，及时为额度用尽的客户充值。

---

## 🎯 下一步优化

- [ ] 添加后台管理页面
- [ ] 支持客户自助充值
- [ ] 添加使用统计图表
- [ ] 支持更多 AI 模型
- [ ] 添加历史记录功能

---

## 📞 技术支持

如有问题，请联系管理员。

---

**部署完成后，你就有了一个可以交付给客户的 AI 产品！** 🎉
