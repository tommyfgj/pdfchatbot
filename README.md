# PDF Chatbot - AI 驱动的 PDF 阅读器

一个结合了 PDF 阅读和 AI 聊天功能的现代化应用，让你可以在阅读 PDF 时快速与 AI 对话，理解文档内容。

## ✨ 功能特性

### PDF 阅读器（完整的 PDF.js Viewer）
- 📄 **完整功能**：工具栏、侧边栏、搜索、打印等
- 📖 **页面导航**：缩略图、大纲、书签
- 🔍 **缩放旋转**：自由缩放和页面旋转
- 📝 **文本选择**：支持文本选择和复制

### 批注功能（pdfjs-annotation-extension）
- ✏️ **14 种批注工具**：矩形、圆形、自由绘制、箭头、云形线等
- 🎨 **文本标注**：高亮、下划线、删除线
- 📌 **注释功能**：文本批注、签名、印章
- 💾 **批注管理**：编辑、删除、导出批注

### AI 聊天助手
- 🤖 **DeepSeek 集成**：高性价比的 AI 对话
- 🎯 **菜单集成**：在文本选择菜单中添加"发送到 AI"按钮
- 💬 **实时流式响应**：使用 Vercel AI SDK 实现流式回复
- 🎨 **现代化 UI**：基于 Tailwind CSS 的美观界面
- ⚡ **一键发送**：选择文本后点击菜单按钮即可发送到聊天框

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入你的 API 密钥：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，选择你想使用的 AI 提供商：

**使用 DeepSeek（推荐，性价比高）：**
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
AI_PROVIDER=deepseek
```

**或使用 OpenAI：**
```env
OPENAI_API_KEY=your_openai_api_key_here
AI_PROVIDER=openai
```

### 3. 运行开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📖 使用方法

1. **上传 PDF**：点击"上传 PDF"按钮选择你的 PDF 文件
2. **阅读文档**：使用完整的 PDF.js viewer 功能（工具栏、侧边栏、搜索等）
3. **添加批注**：使用批注工具在 PDF 上做标记（高亮、下划线、删除线等）
4. **选择文本**：在 PDF 中选择任意文本
5. **发送到 AI**：在弹出的菜单中点击"💬 发送到 AI"按钮
6. **AI 对话**：选中的文本会自动填充到右侧聊天框
7. **获取解答**：AI 会实时流式返回答案，帮助你理解文档内容

## 🛠️ 技术栈

- **框架**：Next.js 15 (App Router)
- **UI**：React 19 + Tailwind CSS
- **PDF 渲染**：PDF.js 4.3.136 (完整 Viewer)
- **批注扩展**：pdfjs-annotation-extension v2.2.0
- **AI 集成**：Vercel AI SDK + DeepSeek / OpenAI
- **语言**：TypeScript

## 📁 项目结构

```
pdfchatbot/
├── app/
│   ├── api/chat/                      # AI 聊天 API 路由
│   ├── globals.css                    # 全局样式
│   ├── layout.tsx                     # 根布局
│   └── page.tsx                       # 主页面
├── components/
│   ├── PDFViewerIframe.tsx            # PDF Viewer 组件（iframe 方式）
│   └── ChatPanel.tsx                  # 聊天面板组件
├── public/
│   ├── web/                           # PDF.js viewer 完整文件
│   │   ├── viewer.html                # 主 viewer（已集成 annotation）
│   │   ├── viewer.mjs                 # Viewer 逻辑
│   │   ├── text-selection-bridge.js   # 文本选择桥接
│   │   └── ...
│   ├── pdfjs-annotation-extension/    # 批注扩展
│   │   ├── pdfjs-annotation-extension.js
│   │   └── font/
│   └── build/                         # PDF.js 核心库
├── lib/
│   └── ai-config.ts                   # AI 配置
├── .env.example                       # 环境变量示例
├── SETUP.md                           # 详细集成说明
└── README.md
```

## 🎯 核心功能实现

### PDF 阅读器
- 使用 PDF.js 渲染 PDF 页面
- 支持页面导航和缩放
- 文本层支持文本选择

### AI 聊天
- 使用 Vercel AI SDK 的 `useChat` hook
- 流式响应提升用户体验
- 自动处理选中文本

### 交互设计
- 选择文本后自动填充到聊天框
- 支持键盘快捷键（Enter 发送，Shift+Enter 换行）
- 实时消息滚动

## 🔧 自定义配置

### 更换 AI 提供商

在 `.env.local` 中设置 `AI_PROVIDER`：

```env
# 使用 DeepSeek（默认，性价比高）
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key

# 或使用 OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=your_key
```

### DeepSeek API 获取

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册并登录账号
3. 在 API Keys 页面创建新的 API 密钥
4. DeepSeek 提供极具性价比的 API 服务，价格远低于 OpenAI

### 调整 PDF 渲染

编辑 `components/PDFViewer.tsx` 中的 `scale` 初始值来调整默认缩放比例。

## 📝 待办事项

- [x] 集成完整的 PDF.js viewer
- [x] 集成 pdfjs-annotation-extension 批注功能
- [x] 支持 DeepSeek AI
- [ ] 批注数据持久化存储
- [ ] 支持多文件管理
- [ ] 添加聊天历史记录
- [ ] 支持导出对话和批注
- [ ] 添加更多 AI 模型选择
- [ ] 支持暗色模式

## 📖 详细文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 🚀 快速启动指南 - 5 分钟上手 |
| [USAGE_GUIDE.md](./USAGE_GUIDE.md) | 📘 详细使用指南 - 功能说明和最佳实践 |
| [CHAT_INTEGRATION.md](./CHAT_INTEGRATION.md) | 💬 聊天集成说明 - 如何在菜单中添加"发送到 AI" |
| [SETUP.md](./SETUP.md) | 🔧 集成配置指南 - 技术细节和配置 |
| [SUMMARY.md](./SUMMARY.md) | 📋 项目总结 - 完整功能和架构说明 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [PDF.js](https://github.com/mozilla/pdf.js) - PDF 渲染引擎
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI 集成框架
- [pdfjs-annotation-extension](https://github.com/Laomai-codefee/pdfjs-annotation-extension) - PDF 批注灵感来源
- [ai-chatbot](https://github.com/vercel/ai-chatbot) - AI 聊天参考实现
