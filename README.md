<p align="left"><img src="icons/icon128.png" width="100" alt="AI 简历自动填充助手图标"></p>

# AI 简历自动填充助手

[![樱落生态成员](https://raw.githubusercontent.com/Guyao146/Sakura-EcoSystem-wiki/main/assets/ConnectEcoSystem.svg)](https://mcylyr.cn)
[![已编写Wiki](https://raw.githubusercontent.com/Guyao146/Sakura-EcoSystem-wiki/main/assets/sakura-wiki.svg)](https://wiki.mcylyr.cn/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-1677ff)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL--v3-blue.svg)](LICENSE)

<p align="left">
  <b>上传简历，让 AI 帮你完成重复的网页表单填写</b>
</p>

<p align="left">
  📄 PDF / Word / TXT · 🤖 OpenAI / Kimi · 🔍 表单识别
</p>
<p align="left">
  ✍️ 一键填充 · 🎨 高亮反馈 · 🔒 本地存储
</p>

## 樱落生态 Wiki

该项目已编写 Wiki，了解架构、权限、数据流和限制：

<https://wiki.mcylyr.cn/#/docs/resume-smart-filler-assistant>

## 项目简介

**AI 简历自动填充助手** 是一个面向 Chrome、Edge 等 Chromium 浏览器的 Manifest V3 扩展。

扩展允许用户上传简历文件或直接粘贴简历文本，提取姓名、联系方式、教育背景、工作经验、技能和项目经验等信息；打开招聘网站或公司申请页面后，扩展会扫描当前页面中的表单字段，先使用关键词规则匹配常见字段，再使用用户配置的 AI 服务理解复杂字段，最后把匹配结果写回表单。

它不提供独立的账号系统或项目后端。简历文本、解析结果、API Key 和扩展设置保存在浏览器的 `chrome.storage.local` 中。执行 AI 匹配时，简历正文片段和表单字段上下文会发送到用户选择的 AI 服务，因此使用前请确认服务商的隐私政策，不要上传不必要的敏感信息。

> **减少重复输入，把时间留给真正重要的求职准备**
>
> **AI 负责理解字段，你负责确认最终内容**

---

# 功能概览

## 简历导入

- 支持 PDF、Word（`.doc` / `.docx`）和 TXT 文件。
- 支持拖拽上传，也支持手动粘贴简历文本。
- 单个文件最大 `10 MB`。
- 上传后显示姓名、电话、邮箱和部分简历段落的解析预览。
- 已解析的简历保存在浏览器本地，可删除或从设置页导出为 JSON。

## AI 表单匹配

- 自动扫描当前页面的 `input`、`textarea` 和 `select` 控件。
- 过滤隐藏、提交、按钮、重置、禁用和只读字段。
- 先通过关键词规则处理姓名、邮箱、电话、学历、工作经历、技能、项目、城市等常见字段。
- 规则无法处理的字段交给 AI 进行语义匹配。
- 为字段收集 `label`、`name`、`id`、`placeholder`、`aria-label` 和周边文本等上下文。
- 完成后显示识别字段、成功填充和未匹配字段统计。

## 网页填充

- 普通文本字段、日期字段可直接填充。
- `select` 会尝试匹配选项文本或选项 value。
- `checkbox` 根据 AI 返回的布尔值设置勾选状态。
- `radio` 会在同名单选项中匹配 value。
- 填充后触发 `input`、`change` 和 `blur` 事件，兼容常见前端框架的变更监听。
- 成功填充的字段会短暂显示浅绿色背景。

## 手动补充

AI 无法匹配的字段可以通过手动面板处理：

- **定位**：滚动到目标字段并临时显示蓝色轮廓。
- **填充**：输入或修改字段值，扩展会触发输入和变更事件。
- **快捷键**：`Ctrl + Shift + R` 打开或关闭手动填充面板。

---

# 快速开始

## 环境要求

```text
Chrome / Edge 等支持 Manifest V3 的 Chromium 浏览器
一个可用的 OpenAI、Moonshot 或兼容接口 API Key
允许加载未打包扩展的浏览器环境
```

项目当前是直接加载的浏览器扩展，没有 `package.json`、Node.js 构建流程或依赖安装步骤。

---

## 下载项目

```bash
git clone https://github.com/Guyao146/Resume-Smart-Filler-Assistant.git
cd Resume-Smart-Filler-Assistant
```

也可以在 GitHub 页面下载 ZIP 并解压。无论使用哪种方式，扩展根目录必须包含 `manifest.json`。

---

## 安装扩展

1. 打开浏览器扩展管理页面：
   - Chrome：`chrome://extensions/`
   - Edge：`edge://extensions/`
2. 打开右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**。
4. 选择刚刚下载的 `Resume-Smart-Filler-Assistant` 根目录。
5. 将扩展固定到浏览器工具栏，点击 📝 图标打开弹窗。

> README 中的目录名应以实际仓库目录为准，不需要把项目重命名为 `resume-autofill-extension/`。

### 打包安装（可选）

如果需要生成 Chrome/Edge 扩展包：

1. 在扩展管理页面点击 **打包扩展程序**；
2. 选择项目根目录；
3. 浏览器会生成 `.crx` 和 `.pem` 文件。

`.pem` 是扩展私钥，请勿提交到 Git，也不要发送给不可信的第三方。

---

# 使用说明

## 1. 配置 AI 服务

点击扩展图标后打开 **设置**，根据服务商填写：

| 提供商 | 可选模型 | 默认请求地址 |
| --- | --- | --- |
| OpenAI | `gpt-4o`、`gpt-4o-mini`、`gpt-3.5-turbo` | `https://api.openai.com/v1/chat/completions` |
| Moonshot AI | `moonshot-v1-8k`、`moonshot-v1-32k`、`moonshot-v1-128k` | `https://api.moonshot.cn/v1/chat/completions` |
| 自定义 API | `custom` | 用户填写完整地址 |

API Key 来源：

- OpenAI：[API keys](https://platform.openai.com/api-keys)
- Moonshot：[Moonshot 开放平台](https://platform.moonshot.cn/)

自定义服务需要兼容 OpenAI Chat Completions 接口，并返回类似以下结构：

```json
{
  "choices": [
    {
      "message": {
        "content": "[{\"index\":0,\"value\":\"张三\"}]"
      }
    }
  ]
}
```

请求使用 Bearer API Key，温度为 `0.1`，最大输出 Token 为 `2000`。扩展不会把 API Key 发送到自有服务器，但会把它直接用于访问你选择的 AI API。

## 2. 导入简历

点击上传区域选择文件，或把文件拖入扩展弹窗。支持：

```text
.pdf   .doc   .docx   .txt
```

也可以选择 **手动粘贴简历文本**，粘贴至少 20 个字符后点击 **保存并解析**。

解析逻辑：

- TXT 直接读取文件文本。
- PDF 使用 `pdfjsLib`（如果运行环境提供），否则使用基础原始字节提取回退逻辑。
- DOCX 尝试提取 XML 中的 `<w:t>` 节点。
- DOC 使用基础字节转文本方式，复杂文档可能丢失内容。

解析结果会保存到 `chrome.storage.local` 的 `resume` 键中，包含原始文本、解析字段、文件名、文件大小和时间戳。

## 3. 扫描并填充

1. 打开招聘网站、公司官网申请页面或其他表单页面。
2. 确认页面已经加载完成，并且表单不是位于浏览器禁止访问的特殊页面。
3. 点击扩展图标，选择 **扫描并填充当前页面**。
4. 扩展扫描当前页面的可用字段，发送字段信息给后台 Service Worker。
5. 等待规则匹配和 AI 匹配完成。
6. 查看结果后，检查被填入的内容，再由用户手动提交网页表单。

扩展不会自动点击“提交”按钮，也不会替用户确认招聘网站的隐私协议、授权声明或其他法律文件。

## 4. 手动补充字段

在填充结果中点击 **手动补充填写**，页面右侧会打开面板。面板会列出当前页面中未隐藏、未禁用且可编辑的字段：

1. 点击 **定位**，滚动到字段位置；
2. 点击 **填充**，在提示框中输入内容；
3. 填充完成后检查页面显示和校验状态。

快捷键：

```text
Ctrl + Shift + R  打开 / 关闭手动填充面板
```

---

# 技术架构

## 工作流程

```text
用户上传简历或粘贴文本
          │
          ├─ Popup 提取简历文本
          ├─ 正则提取基础字段和段落
          └─ chrome.storage.local 保存简历
                     │
          用户点击“扫描并填充当前页面”
                     │
          chrome.scripting.executeScript
                     │
          扫描页面表单控件与字段上下文
                     │
       本地关键词匹配 ──┴── AI 语义匹配
                     │
          按控件类型写入目标字段
                     │
          触发 input/change/blur 事件
                     │
          显示填充结果与未匹配列表
```

## 扩展组件

| 组件 | 作用 |
| --- | --- |
| Popup | 上传简历、粘贴文本、查看解析预览、配置模型、触发扫描和展示结果 |
| Background Service Worker | 处理扩展消息、本地字段规则匹配、AI API 请求和手动面板注入 |
| Content Script | 页面表单检测、动态 DOM 观察、空字段高亮和快捷键通信 |
| Options Page | 独立设置页、简历删除/导出和使用统计展示 |
| `lib/` | PDF.js 相关资源目录；当前弹窗没有直接加载这些脚本 |

## 表单字段识别

扫描阶段会收集：

- `label`、`name`、`id`、`placeholder`、`aria-label`；
- `data-field`、`data-name`、`data-label`；
- 字段所在 `div`、`td`、`fieldset` 或 `tr` 的有限文本上下文；
- 标签名、控件类型、是否必填和 `select` 的选项；
- 用于重新定位字段的 CSS 路径。

字段标签会依次尝试标准 `label[for]`、父级 label、相邻 label/文本节点、表单项的第一个子节点和带有 `label`、`field`、`item`、`form` 类名的祖先节点。页面语义越规范，匹配结果通常越可靠。

## 两阶段匹配

后台先对常见字段执行规则匹配。当前规则覆盖：

```text
姓名、邮箱、电话、教育、工作经验、技能、项目
地址、城市、生日、性别、LinkedIn、GitHub
个人网站、期望薪资、应聘职位
```

如果规则无法直接给出值，剩余字段才会进入 AI 匹配。AI Prompt 包含最多 `6000` 个字符的简历正文、解析出的关键信息，以及字段的索引、标签、名称、占位符、类型和上下文。

AI 需要返回纯 JSON 数组：

```json
[
  {"index": 0, "value": "具体值"},
  {"index": 1, "value": "NOT_FOUND"}
]
```

返回 `NOT_FOUND`、`N/A`、无法解析响应或 API 请求失败的字段会进入未匹配列表，不会使用猜测内容覆盖表单。

---

# 配置、权限与隐私

## 本地配置

扩展通过 `chrome.storage.local` 保存以下数据：

| 键 | 内容 |
| --- | --- |
| `resume` | 文件名、大小、原始文本、解析结果和上传时间戳 |
| `settings` | AI 提供商、API Key、自定义地址、模型及填充选项 |
| `stats` | 设置页读取的填充次数、字段数和成功率数据 |

设置页支持删除已保存简历和导出 `resume-data.json`。导出文件包含简历原文，应视为敏感资料保管。

## Manifest V3 权限

```json
{
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "clipboardWrite"
  ],
  "host_permissions": [
    "http://*/*",
    "https://*/*"
  ]
}
```

Content Script 会在 HTTP/HTTPS 页面 `document_end` 阶段加载，并观察动态添加的表单。扩展使用 `scripting` 在当前标签页扫描和填充字段，因此浏览器可能在安装或使用时显示网页访问权限提示。

## 数据发送边界

- 没有自有后端、用户账号或远程数据库。
- 简历和 API Key 默认只保存在本地浏览器。
- 只有执行 AI 匹配时，后台才向选定的 AI 端点发起请求。
- 请求可能包含简历正文前 6000 个字符、解析结果和网页表单字段上下文。
- 不会自动提交表单，也不会把数据发送到 OpenAI/Moonshot 之外的固定业务服务器。

请不要把身份证号、银行卡号、与求职无关的详细住址等信息交给不必要的第三方模型。自定义 API 地址必须是你信任的服务，并且应使用 HTTPS。

---

# 常见问题

## Word 或 PDF 解析结果不完整

当前 Word 解析是轻量实现：`.docx` 尝试读取 XML 文本节点，`.doc` 使用基础字节文本提取。复杂排版、图片文字、旧式二进制文档和扫描 PDF 都可能丢失内容。建议转换为可复制文本的 PDF/TXT，或直接使用手动粘贴。

仓库虽然包含 `lib/pdf.js` 与 `lib/pdf.worker.js`，但 `popup/popup.html` 当前没有直接加载 PDF.js；当运行环境没有 `pdfjsLib` 时，PDF 会使用基础回退提取逻辑，不能视为完整 PDF 排版解析器。

## 某些字段没有被填充

可能原因：

1. 简历文本中没有对应信息；
2. 页面字段缺少 label、name、placeholder、ARIA 或周边文本；
3. `select` 的选项与 AI 返回的文本/value 不匹配；
4. 字段位于 iframe、浏览器特殊页面或被站点安全策略隔离；
5. 目标字段是文件上传控件，当前实现明确不会自动设置 file input。

解决方法：先展开解析预览确认简历文本，再使用手动填充面板逐字段定位和输入。

## 提示 API 请求失败

请检查：

- API Key 是否正确，是否有多余空格；
- 账户余额、模型权限和网络连接是否正常；
- 自定义地址是否为完整的 `/v1/chat/completions` 路径；
- 自定义服务是否返回 `choices[0].message.content`；
- 浏览器是否允许扩展访问对应 API 域名。

后台会将 HTTP 状态码和服务端错误消息返回给 Popup。AI 失败时，剩余字段会保留在未匹配列表中，不会继续盲目填充。

## 插件在某些网站不工作

扩展只匹配普通 HTTP/HTTPS 页面。`chrome://`、`edge://`、浏览器商店、扩展管理页以及部分银行/支付页面可能禁止内容脚本或脚本注入。跨域 iframe、严格 CSP、自定义控件和没有语义属性的表单也会降低识别率。

请刷新目标页面后重试，并优先在标准 HTML 表单上使用。无论识别结果如何，都应在提交前逐项检查姓名、联系方式、学历、工作经历和隐私授权内容。

## 修改代码后如何生效

这是未打包扩展，不需要构建：

1. 打开 `chrome://extensions/` 或 `edge://extensions/`；
2. 找到“AI 简历自动填充助手”；
3. 点击扩展卡片上的 **重新加载**；
4. 刷新目标网页，使新的 Content Script 重新注入。

当前仓库的 `background/background.js` 在 `buildMatchingPrompt` 模板字符串结束后存在重复的残留 JSON 片段；如果浏览器报告 Service Worker 语法错误，请先删除该重复片段再重新加载扩展。该问题属于当前源码状态，后续修复后本段说明应同步更新。

---

# 项目结构

```text
Resume-Smart-Filler-Assistant/
├── manifest.json               # Manifest V3 清单、权限、入口和资源声明
├── icons/                      # 16 / 32 / 48 / 128 像素扩展图标
├── popup/
│   ├── popup.html              # 上传、解析预览、设置、扫描进度和结果界面
│   ├── popup.css               # 弹窗样式
│   └── popup.js                # 文件处理、简历解析和扫描/填充流程
├── background/
│   └── background.js           # Service Worker：规则匹配、AI 请求和手动面板
├── content/
│   └── content.js              # 页面表单检测、空字段高亮和快捷键通信
├── options/
│   ├── options.html            # 独立设置页
│   ├── options.css             # 设置页样式
│   └── options.js              # 设置、简历管理和统计展示
├── lib/
│   ├── pdf.js                  # PDF.js 资源
│   └── pdf.worker.js           # PDF.js Worker 资源
└── LICENSE                     # GNU AGPL v3 完整许可证文本
```

---

# 开源协议

本项目根目录 `LICENSE` 使用 **GNU Affero General Public License v3（GNU AGPL v3 / AGPL-3.0）**。

你可以在许可证条件下运行、研究、修改和再分发本项目。修改并分发时需要保留许可证和版权声明，并按 AGPL v3 提供对应源代码；如果修改后的程序支持用户通过网络远程交互，还需要按 AGPL 第 13 条向远程用户提供获取对应源代码的方式。

完整法律条款请阅读仓库中的 [`LICENSE`](LICENSE)。许可证文件是本项目授权条件的依据。

---

# 贡献

欢迎提交 Issue 和 Pull Request：

1. Fork 本仓库；
2. 创建功能分支；
3. 在本地浏览器中以开发者模式加载并测试扩展；
4. 确认没有提交 API Key、简历原文、`.pem` 私钥或导出的 `resume-data.json`；
5. 提交清晰的变更说明和复现步骤。

提交问题时，请说明浏览器版本、目标页面类型、文件格式、AI 提供商和控制台错误。不要在 Issue 中公开 API Key 或完整简历内容。

---

Made with ❤️ by AI Developer