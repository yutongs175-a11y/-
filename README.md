# ScriptCraft AI（剧本工坊）

AI 剧本创作软件 — 一个软件，五大创作模块。

## 五大创作模块

| 模块 | 职责 |
|------|------|
| 💡 灵感工坊 | 故事构思、主题探索、Logline 提炼 |
| 👥 角色档案 | 角色创建、性格弧光、关系图谱 |
| 📋 分场大纲 | 节拍表、三幕结构、分场拆解 |
| 🎬 剧本正文 | 标准格式剧本撰写、场景描写 |
| 💬 对白润色 | 台词优化、角色声音、潜台词 |

## 快速开始

### 1. 安装依赖

```bash
cd screenplay-ai
npm install
```

### 2. 启动后端

```bash
node_modules/.bin/tsx server/index.ts
```

后端默认运行在 http://localhost:3001

### 3. 启动前端

另开一个终端窗口：

```bash
cd screenplay-ai
node_modules/.bin/vite
```

前端默认运行在 http://localhost:5173

### 4. 配置 AI

1. 打开前端页面，在左侧栏底部点击 **⚙️ AI 设置**
2. 选择一个提供商：DeepSeek / 豆包(字节) / 通义千问(阿里)
3. 填写你的 API 密钥
4. 选择模型
5. 点击保存

### 获取 API 密钥

- **DeepSeek**: https://platform.deepseek.com/api_keys （新用户有免费额度）
- **豆包**: https://console.volcengine.com/ark/region:ark+cn-beijing/apikey
- **通义千问**: https://dashscope.console.aliyun.com/apikey

> 🔒 密钥仅保存在浏览器本地（localStorage），不会上传到任何服务器。

## 架构

- **前端**: React 18 + Vite 5 + TypeScript + Tailwind CSS + Zustand
- **后端**: Express 4 + TypeScript + SSE 流式响应
- **AI**: 直连用户自己的大模型 API（OpenAI 兼容格式）
- **存储**: JSON 文件

## 开发

```bash
npm run dev          # 同时启动前后端
npm run dev:server   # 仅后端
npm run dev:client   # 仅前端
npm run build        # 构建前端
```
