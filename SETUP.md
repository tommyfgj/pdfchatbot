# PDF Chatbot 集成完成说明

## ✅ 已完成的集成

### 1. **完整的 PDF.js Viewer**
- 下载并解压了 `pdfjs-4.3.136-dist` 到 `/public/` 目录
- 这是完整的 PDF.js viewer，包含所有功能

### 2. **pdfjs-annotation-extension 集成**
- 已将 annotation extension 复制到 `/public/pdfjs-annotation-extension/`
- 在 `viewer.html` 中添加了 annotation extension 脚本引用
- 位置：`/public/web/viewer.html` 第 37 行

### 3. **文本选择桥接**
- 创建了 `text-selection-bridge.js` 用于将 PDF 中的文本选择发送到主应用
- 使用 `postMessage` API 实现跨 iframe 通信

### 4. **React 组件**
- `PDFViewerIframe.tsx` - 使用 iframe 嵌入完整的 PDF.js viewer
- 支持文本选择并传递给 AI 聊天组件

## 📁 文件结构

```
pdfchatbot/
├── public/
│   ├── web/                           # PDF.js viewer 完整文件
│   │   ├── viewer.html                # 主 viewer（已修改，添加了 annotation extension）
│   │   ├── viewer.mjs                 # Viewer 逻辑
│   │   ├── viewer.css                 # Viewer 样式
│   │   ├── text-selection-bridge.js   # 文本选择桥接脚本
│   │   ├── images/                    # 图标资源
│   │   ├── locale/                    # 国际化文件
│   │   └── ...
│   ├── pdfjs-annotation-extension/    # 批注扩展
│   │   ├── pdfjs-annotation-extension.js
│   │   └── font/
│   └── build/                         # PDF.js 核心库
├── components/
│   └── PDFViewerIframe.tsx            # PDF Viewer 组件
└── app/
    └── page.tsx                       # 主页面
```

## 🎯 功能特性

### PDF 查看器（完整的 PDF.js Viewer）
- ✅ 完整的工具栏（缩放、旋转、打印等）
- ✅ 侧边栏（缩略图、大纲、附件）
- ✅ 搜索功能
- ✅ 页面导航
- ✅ 文本选择和复制
- ✅ 打印和下载

### 批注功能（pdfjs-annotation-extension）
- ✅ 14 种批注工具：
  - 矩形、圆形
  - 自由绘制
  - 箭头、云形线
  - 文本高亮、下划线、删除线
  - 文本批注
  - 签名、印章
  - 等等...
- ✅ 批注编辑和删除
- ✅ 批注导出

### AI 聊天
- ✅ 选择 PDF 文本后自动填充到聊天框
- ✅ DeepSeek AI 集成
- ✅ 流式响应

## 🚀 使用方法

### 1. 启动项目

```bash
npm run dev
```

### 2. 访问应用

打开 http://localhost:3000

### 3. 使用流程

1. **上传 PDF**：点击"上传 PDF"按钮
2. **查看 PDF**：使用完整的 PDF.js viewer 功能
3. **添加批注**：使用左侧工具栏的批注工具
4. **选择文本**：选择 PDF 中的任意文本
5. **AI 对话**：选中的文本会自动出现在右侧聊天框，点击发送与 AI 对话

## 🔧 关键修改

### 1. viewer.html 修改

在 `/public/web/viewer.html` 的 `</head>` 标签前添加：

```html
<!-- pdfjs-annotation-extension integration -->
<script src="../pdfjs-annotation-extension/pdfjs-annotation-extension.js" type="module"></script>
<!-- Text selection bridge for AI chat -->
<script src="text-selection-bridge.js"></script>
```

### 2. 文本选择桥接

`text-selection-bridge.js` 监听文本选择并发送消息：

```javascript
document.addEventListener('mouseup', function() {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  
  if (text && text.length > 0) {
    window.parent.postMessage({
      type: 'textSelected',
      text: text
    }, '*');
  }
});
```

### 3. React 组件接收消息

`PDFViewerIframe.tsx` 监听来自 iframe 的消息：

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'textSelected') {
      onTextSelect(event.data.text);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [onTextSelect]);
```

## 📝 批注扩展配置

### URL 参数

可以通过 URL 参数配置批注扩展：

```
/web/viewer.html?file=xxx.pdf#ae_username=用户名&ae_default_editor_active=true
```

参数说明：
- `ae_username` - 批注者名称
- `ae_get_url` - 加载已保存批注数据的 URL
- `ae_post_url` - 提交批注数据的 URL
- `ae_default_editor_active` - 是否默认激活编辑器（true/false）
- `ae_default_sidebar_open` - 是否默认打开侧边栏（true/false）

### 示例

```typescript
const viewerUrl = `/web/viewer.html?file=${encodeURIComponent(pdfUrl)}#ae_username=张三&ae_default_editor_active=true`;
```

## 🎨 自定义样式

如果需要自定义 PDF viewer 的样式，可以修改：
- `/public/web/viewer.css` - Viewer 样式
- 或在主应用中通过 CSS 覆盖 iframe 内的样式

## 🐛 故障排除

### 问题：批注工具栏未显示

检查：
1. `pdfjs-annotation-extension.js` 是否正确加载
2. 浏览器控制台是否有错误
3. PDF.js 版本是否兼容（推荐 4.3.136）

### 问题：文本选择不触发 AI 聊天

检查：
1. `text-selection-bridge.js` 是否加载
2. 浏览器控制台查看 postMessage 是否发送
3. React 组件是否正确监听 message 事件

### 问题：PDF 无法加载

检查：
1. PDF 文件是否有效
2. Blob URL 是否正确创建
3. 浏览器控制台是否有 CORS 错误

## 📚 参考资源

- [PDF.js 官方文档](https://mozilla.github.io/pdf.js/)
- [pdfjs-annotation-extension GitHub](https://github.com/Laomai-codefee/pdfjs-annotation-extension)
- [pdfjs-annotation-extension 在线演示](https://laomai-codefee.github.io/pdfjs-annotation-extension/)

## 🎉 完成！

现在你有一个完整的 PDF 阅读器，包含：
- ✅ 完整的 PDF.js viewer 功能
- ✅ 强大的批注工具
- ✅ AI 聊天集成
- ✅ 文本选择快速提问

享受你的 PDF Chatbot！🚀
