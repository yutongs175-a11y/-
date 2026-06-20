# 🚀 ScriptCraft AI 部署教程（超详细新手版）

> 本教程会从零开始，一步一步带你把项目部署到公网上。
> 哪怕你完全不懂部署，照着做也能成功！

---

## 📋 部署架构说明

```
你写的代码
├── 前端（React 页面）  →  部署到 Vercel（免费）
├── 后端（Express API） →  部署到 Railway（有免费额度）
└── 数据库（MongoDB）  →  部署到 MongoDB Atlas（免费）
```

**用户访问流程**：
用户打开你的 Vercel 网址 → 前端页面加载 → 前端调用 Railway 后端 API → 后端读写 MongoDB Atlas 数据库

---

## 第一步：准备代码（在本地电脑操作）

### 1.1 确认所有修改已保存

打开终端，进入项目目录：
```bash
cd /Users/reveriesu/WorkBuddy/2026-06-20-12-46-08/screenplay-ai
```

### 1.2 安装新的依赖包

```bash
npm install
```
> 这会把 `mongodb` 驱动包安装进去（已经加在 package.json 里了）

### 1.3 推送到 Git 仓库（必须有！）

Vercel 和 Railway 都是**从 Git 仓库拉代码**来部署的，所以你需要先把代码推送到 GitHub/Gitee。

如果你还没有 Git 仓库：
```bash
# 1. 初始化 Git
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "准备部署"

# 4. 在 GitHub 上创建一个新的仓库（网页上操作）
#    创建好后，复制仓库地址，比如：
#    https://github.com/你的用户名/scriptcraft-ai.git

# 5. 关联远程仓库
git remote add origin https://github.com/你的用户名/scriptcraft-ai.git

# 6. 推送到 GitHub
git push -u origin main
```
> 如果提示分支名不对，把 `main` 改成 `master` 试试

✅ **完成后，在 GitHub 网页上能看到的代码，才能进行下一步！**

---

## 第二步：创建 MongoDB Atlas 数据库（免费）

> MongoDB Atlas 是云端 MongoDB 数据库，免费版足够个人使用。

### 2.1 注册账号

1. 打开 https://www.mongodb.com/cloud/atlas/register
2. 填写注册信息（可以用 Google 账号快速注册）
3. 邮箱验证

### 2.2 创建免费集群

1. 登录后，点击 **"Create a cluster"**（创建集群）
2. 选择 **"M0 FREE"**（永远免费！）
3. 地区选择 **"Asia Pacific (Hong Kong)"**（香港，离中国最近）
4. 点击 **"Create Cluster"**（创建集群）
   > 等待 3-5 分钟，集群创建需要一点时间

### 2.3 创建数据库用户（很重要！）

1. 在集群页面，点击 **"Database Access"**（左侧菜单）
2. 点击 **"+ ADD NEW DATABASE USER"**
3. 设置用户名和密码：
   - Username（用户名）：`scriptcraft-admin`
   - Password（密码）：点击 "Autogenerate Secure Password" 自动生成，并**复制保存好**！
4. 权限选择 **"Read and write to any database"**
5. 点击 **"Add User"**

### 2.4 允许所有 IP 访问

1. 点击 **"Network Access"**（左侧菜单）
2. 点击 **"+ ADD IP ADDRESS"**
3. 点击 **"ALLOW ACCESS FROM ANYWHERE"**（允许任何 IP 访问）
4. 确认

### 2.5 获取连接字符串（复制保存！）

1. 回到 **"Database"** 页面
2. 点击集群名称下面的 **"Connect"** 按钮
3. 选择 **"Drivers"**
4. 复制连接字符串，类似这样：
   ```
   mongodb+srv://scriptcraft-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. 把 `<password>` 替换成你在 2.3 步设置的密码
6. **完整保存这个字符串**，Railway 部署时需要用！

✅ **MongoDB Atlas 配置完成！**

---

## 第三步：部署后端到 Railway（有免费额度）

> Railway 可以免费运行一个小服务，每个月有 $5 的免费额度，够个人使用。

### 3.1 注册 Railway 账号

1. 打开 https://railway.app
2. 点击 **"Login"**，用 GitHub 账号授权登录（推荐）

### 3.2 创建新项目

1. 登录后，点击 **"+ New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 选择你的 `scriptcraft-ai` 仓库
4. 点击 **"Deploy Now"**

### 3.3 配置环境变量（非常重要！）

部署开始后，进入项目设置页面：

1. 点击顶部你的服务名称
2. 点击 **"Variables"** 标签
3. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `MONGODB_URI` | 你在 2.5 步复制的连接字符串 | MongoDB 数据库连接地址 |
| `NODE_ENV` | `production` | 生产环境标识 |
| `PORT` | `3001` | 服务端口（Railway 会自动覆盖，但写上更保险）|

添加方法：点击 **"+ New Variable"**，输入名字和值，回车确认。

### 3.4 获取后端访问地址

1. 等待部署完成（看到绿色的 "Success" 提示）
2. 点击顶部的 **"Settings"** 标签
3. 在 **"Domains"** 部分，点击 **"Generate Domain"**
4. 会生成一个网址，类似：
   ```
   https://scriptcraft-ai-production.railway.app
   ```
5. **复制保存这个网址**，Vercel 部署时需要用！

### 3.5 测试后端是否正常工作

在浏览器打开：
```
https://你的railway网址/api/health
```

如果看到类似这样的 JSON 响应，说明后端部署成功！
```json
{
  "status": "ok",
  "engine": "real-llm",
  "features": ["chat", "image-gen", "video-gen"]
}
```

✅ **Railway 后端部署完成！**

---

## 第四步：部署前端到 Vercel（免费）

> Vercel 对个人项目完全免费，还有免费的 HTTPS 证书。

### 4.1 注册 Vercel 账号

1. 打开 https://vercel.com
2. 点击 **"Sign Up"**，用 GitHub 账号授权登录（推荐）

### 4.2 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 选择你的 `scriptcraft-ai` 仓库
3. 点击 **"Import"**

### 4.3 配置项目

在配置页面：

1. **Project Name**：`scriptcraft-ai`（可以自定义）
2. **Framework Preset**：Vercel 会自动检测到是 Vite 项目
3. **Root Directory**：留空（默认就是根目录）
4. **Build Command**：`npm run build:client`（我们已经配置好了）
5. **Output Directory**：`dist`（我们已经配置好了）
6. **Environment Variables**（重要！）：
   - 点击 **"Environment Variables"** 展开
   - 添加变量：
     - Name: `VITE_API_BASE_URL`
     - Value: `https://你的railway后端网址`（在 3.4 步获取的，不需要加 `/api`）

### 4.4 开始部署

1. 点击 **"Deploy"** 按钮
2. 等待 2-5 分钟，Vercel 会自动构建和部署
3. 看到 **"Congratulations!"** 页面，说明部署成功！

### 4.5 获取前端访问地址

部署成功后，Vercel 会显示一个网址，类似：
```
https://scriptcraft-ai.vercel.app
```

点击这个网址，就能打开你的应用了！

✅ **Vercel 前端部署完成！**

---

## 第五步：测试完整功能

### 5.1 打开前端网址

在浏览器打开你的 Vercel 网址（例如 `https://scriptcraft-ai.vercel.app`）

### 5.2 创建一个测试项目

1. 点击「开始创作」
2. 填写电影名称、类型等
3. 确认能正常创建项目

### 5.3 测试 AI 功能

> 注意：AI 功能需要用户自己填写 API 密钥（在设置页面），因为：
> - 大模型 API（DeepSeek/豆包等）需要用户自己的密钥
> - 生图/生视频 API 也需要用户自己的密钥
> - 这是按使用量付费的，不可能用部署者的账号

**测试方法**：
1. 进入任意创作模块（比如「灵感工坊」）
2. 点击左侧栏底部的 ⚙️ 设置按钮
3. 填写你的大模型 API 密钥
4. 尝试发送一条 AI 消息，确认能正常回复

### 5.4 检查数据库

登录 MongoDB Atlas → 点击 "Browse Collections"，应该能看到：
- `projects` 集合（项目数据）
- `module_content` 集合（模块内容）
- `chat_messages` 集合（聊天记录）
- `media` 集合（媒体文件记录）

✅ **完整功能测试通过！**

---

## 💰 费用说明

| 服务 | 免费额度 | 超出后费用 |
|--------|-----------|--------------|
| **Vercel** | 完全免费（个人项目） | 团队版 $20/月/人 |
| **Railway** | $5 免费额度/月 | 超出后按使用量计费，约 $0.01/小时 |
| **MongoDB Atlas** | M0 免费集群（永远免费） | 付费版从 $9/月开始 |

**结论**：个人使用完全免费！只有当你有**很多用户**（每天几千次访问）时，Railway 才可能收费。

---

## 🔧 常见问题排查

### 问题1：前端打不开，显示 "Application error"

**原因**：前端构建失败。
**解决**：
1. 在 Vercel 项目页面，点击 **"Deployments"**
2. 点击最近一次部署
3. 查看 **"Build Logs"**，找到红色错误信息
4. 常见问题：依赖安装失败 → 检查 `package.json` 格式是否正确

### 问题2：能打开前端，但 AI 功能用不了

**原因**：后端 API 调用失败。
**解决**：
1. 打开浏览器控制台（F12），查看网络请求
2. 如果看到 API 请求失败，检查：
   - Railway 后端网址是否正确填写在 Vercel 的 `VITE_API_BASE_URL` 环境变量中
   - Railway 服务是否正常运行（在 Railway 控制台查看）
   - CORS 错误 → 需要在后端设置允许的域名（见下面的"进阶配置"）

### 问题3：数据库连不上

**原因**：`MONGODB_URI` 环境变量填错了。
**解决**：
1. 在 Railway 控制台，进入服务 → "Variables"
2. 检查 `MONGODB_URI` 的值
3. 确认密码已替换（不是 `<password>` 占位符）
4. 确认 IP 访问已允许（MongoDB Atlas → Network Access → 有 `0.0.0.0/0` 规则）

---

## 🔒 进阶配置（可选，但推荐）

### A. 设置 CORS 白名单（更安全）

当前后端允许所有网站调用 API（`cors()`），生产环境建议限制为你的 Vercel 域名。

修改 `server/index.ts`，找到 `app.use(cors())` 这一行，改成：
```ts
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://你的vercel域名.vercel.app']
    : true,
}));
```

### B. 使用 Cloudinary 存储媒体文件（推荐）

当前媒体文件（AI 生成的图片/视频）保存在 Railway 服务器上，重启后会丢失。

推荐使用 Cloudinary（免费 25GB 存储）：
1. 注册 Cloudinary 账号：https://cloudinary.com
2. 获取 API 密钥
3. 修改后端代码，把生成的图片/视频上传到 Cloudinary
4. 在 `MEDIA_URL` 环境变量中填写 Cloudinary 的 URL

> 这一步需要改代码，如果需要我可以帮你做。

---

## 📝 部署检查清单

部署完成后，用这个清单确认一切正常：

- [ ] MongoDB Atlas 集群已创建（M0 免费版）
- [ ] MongoDB 数据库用户已创建，密码已保存
- [ ] MongoDB 网络访问已允许所有 IP（`0.0.0.0/0`）
- [ ] Railway 服务已部署成功
- [ ] Railway 环境变量 `MONGODB_URI` 已正确填写
- [ ] Railway 域名已生成，能在浏览器访问 `/api/health`
- [ ] Vercel 项目已部署成功
- [ ] Vercel 环境变量 `VITE_API_BASE_URL` 已填写 Railway 后端网址
- [ ] 前端能正常打开
- [ ] 能正常创建项目
- [ ] AI 功能在填写密钥后能正常使用

---

## 🆘 需要帮助？

如果按照教程操作遇到问题，把以下信息告诉我，我可以帮你排查：

1. 报错截图（浏览器控制台 + 部署平台日志）
2. 你操作到了哪一步
3. 环境变量是否都正确填写了（注意不要泄露密钥内容）

---

**教程结束 🎉**

部署成功后，你就可以把 Vercel 网址分享给朋友，他们就能访问你的 AI 剧本创作软件了！
