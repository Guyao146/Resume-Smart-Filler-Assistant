# 🤖 AI 简历自动填充助手

> 一个 Edge/Chrome 浏览器插件，上传简历后，AI 自动识别网页表单并智能填充。

## ✨ 功能特性

- 📄 **多格式支持**：支持 PDF、Word（.doc/.docx）、TXT 简历上传
- 🤖 **AI 智能匹配**：使用 GPT-4o / Kimi 等 AI 模型，智能理解表单字段含义
- 🔍 **自动表单识别**：自动扫描当前页面所有输入字段
- ✍️ **一键填充**：点击即可自动将简历信息填入对应表单
- 🎨 **高亮反馈**：填充成功的字段会短暂绿色高亮显示
- 🛠️ **手动补充**：未匹配的字段支持手动定位和填写
- 🔐 **隐私安全**：API Key 和简历数据仅存储在本地浏览器中

## 📦 安装方式

### 开发者模式安装（推荐）

1. 下载本项目并解压到本地文件夹
2. 打开 Chrome/Edge 浏览器，进入扩展管理页面：
   - Chrome：`chrome://extensions/`
   - Edge：`edge://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目文件夹 `resume-autofill-extension/`
6. 安装完成，点击浏览器工具栏的 📝 图标即可使用

### 发布到 Chrome Web Store（可选）

如需打包发布：
1. 进入扩展管理页面
2. 点击「打包扩展程序」
3. 选择项目根目录，生成 `.crx` 和 `.pem` 文件

## 🚀 使用教程

### 1. 配置 AI API Key

首次使用需要配置 AI 服务：

1. 点击插件图标，选择「⚙️ 设置」
2. 选择 AI 提供商（OpenAI 或 Moonshot Kimi）
3. 输入你的 API Key：
   - **OpenAI**: 从 [OpenAI Platform](https://platform.openai.com/api-keys) 获取
   - **Kimi**: 从 [Moonshot 开放平台](https://platform.moonshot.cn/) 获取
4. 选择模型（推荐 GPT-4o Mini，性价比高）
5. 点击「保存设置」

### 2. 上传简历

1. 点击插件图标
2. 将简历文件（PDF/Word/TXT）拖拽到上传区域，或点击选择文件
3. 支持格式：`.pdf`、`.doc`、`.docx`、`.txt`
4. 上传成功后，可展开「解析预览」查看提取的关键信息

### 3. 自动填充表单

1. 打开包含求职表单的网页（如招聘网站、公司官网申请页面）
2. 点击插件图标，选择「🔍 扫描并填充当前页面」
3. AI 会自动分析表单字段，并从简历中提取匹配信息
4. 填充完成后，显示统计结果：
   - ✅ 识别字段总数
   - ✅ 成功填充数
   - ⚠️ 未匹配字段（可手动补充）

### 4. 手动补充填写

对于 AI 未匹配到的字段：
- 点击「手动补充填写」按钮
- 页面右侧会弹出操作面板
- 点击「定位」可跳转到对应字段
- 点击「填充」可手动输入值

### 快捷键

- `Ctrl + Shift + R`：在当前页面打开手动填充面板

## 📁 项目结构

```
resume-autofill-extension/
├── manifest.json              # 扩展清单（Manifest V3）
├── icons/                     # 插件图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── popup/                     # 弹窗页面
│   ├── popup.html             # 弹窗 HTML
│   ├── popup.css              # 弹窗样式
│   └── popup.js               # 弹窗逻辑（上传、解析、触发填充）
├── background/                # 后台服务
│   └── background.js          # Service Worker（AI 调用、字段匹配）
├── content/                   # 内容脚本
│   └── content.js             # 页面注入（表单检测、高亮）
├── options/                   # 设置页面
│   ├── options.html           # 设置页 HTML
│   ├── options.css            # 设置页样式
│   └── options.js             # 设置页逻辑
└── lib/                       # 第三方库（预留）
```

## ⚙️ 技术架构

### 工作流程

```
用户上传简历
    ↓
Popup 解析简历文本（PDF/Word/文本提取）
    ↓
简历文本存储在 chrome.storage.local
    ↓
用户点击「扫描并填充」
    ↓
Content Script 扫描当前页面所有表单字段
    ↓
字段信息发送到 Background Service Worker
    ↓
【规则匹配】先尝试关键词匹配（姓名、邮箱、电话等）
    ↓
【AI 匹配】剩余字段通过 AI API 进行语义理解匹配
    ↓
匹配结果返回 Content Script
    ↓
自动填充表单字段，并触发 input/change 事件
    ↓
高亮显示已填充字段
```

### 支持的 AI 提供商

| 提供商 | 模型 | 说明 |
|--------|------|------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-3.5-turbo | 需 OpenAI API Key |
| Moonshot | moonshot-v1-8k/32k/128k | 需 Kimi API Key |
| 自定义 | 任意 | 支持任何 OpenAI 兼容 API |

## 🔒 隐私说明

- **所有数据存储在本地**：简历内容和 API Key 仅保存在浏览器的 `chrome.storage.local` 中
- **无服务器通信**：除了调用你配置的 AI API 外，不会与任何第三方服务器通信
- **数据可控**：可随时在设置页面删除简历或导出数据

## 🐛 常见问题

### Q: 为什么 Word 文档解析效果不太好？

A: 当前版本使用简单的文本提取方式处理 Word 文档。对于复杂排版的 Word 简历，建议先转换为 PDF 或 TXT 格式再上传。

### Q: 某些字段没有被填充？

A: 可能原因：
1. 简历中缺少对应信息
2. 表单字段名称比较特殊，AI 无法理解
3. 使用了下拉选择框（select），AI 返回的值不在选项中

**解决方法**：使用「手动补充填写」功能逐个定位和填充。

### Q: 提示 "API 请求失败"？

A: 请检查：
1. API Key 是否正确（注意区分大小写和空格）
2. 账户是否有可用余额
3. 网络是否可以访问对应 API 地址
4. 自定义 API 的地址格式是否正确（需包含 `/v1/chat/completions`）

### Q: 插件在某些网站不工作？

A: 部分网站（如银行、支付页面）有严格的安全策略，会阻止脚本注入。插件在绝大多数招聘网站（Boss直聘、智联招聘、拉勾、LinkedIn、公司官网等）均可正常使用。

## 📝 更新计划

- [ ] 支持图片简历（OCR 识别）
- [ ] 支持更多 AI 提供商（Claude、Gemini 等）
- [ ] 支持简历模板自动优化
- [ ] 支持批量填充多个页面
- [ ] 更强大的 Word 解析（集成 mammoth.js）
- [ ] 支持表单数据导出和保存

## 📄 开源协议

MIT License

## 🤝 贡献

欢迎提交 Issue 和 PR！如有问题或建议，请通过 GitHub Issues 反馈。

---

Made with ❤️ by AI Developer
