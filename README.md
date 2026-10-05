<p align="left"><img src="icons/icon128.png" width="100" alt="AI 简历自动填充助手图标"></p>

# AI 简历自动填充助手

[![樱落生态成员](https://raw.githubusercontent.com/Guyao146/Sakura-EcoSystem-wiki/main/assets/ConnectEcoSystem.svg)](https://mcylyr.cn)
[![已编写Wiki](https://raw.githubusercontent.com/Guyao146/Sakura-EcoSystem-wiki/main/assets/sakura-wiki.svg)](https://wiki.mcylyr.cn/)
[![License: Sakura-License v1.2](https://img.shields.io/badge/License-Sakura--License--v1.2-pink.svg)](LICENSE)

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

- OpenAI 官方：[API keys](https://platform.openai.com/api-keys)
- Moonshot：[Moonshot 开放平台](https://platform.moonshot.cn/)
- OpenAI 标准的API中转站：[API keys](https://api.example.com/api-keys)

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

## 许可证

本项目采用 **Sakura-License v1.2**（固定文本标识 `Sakura-License-1.2`）。完整正文见 [LICENSE](./LICENSE)，
采用声明（项目、许可人、适用范围与首次适用提交）见 [NOTICE.md](./NOTICE.md)。

- 它是**源码可用（source-available）**许可证，限制特定商业利用，不是 OSI 批准的开源许可证；
- 阅读、运行、复制、修改、分发与自部署免许可费；但**面向第三方的商业利用（销售、订阅、付费 SaaS、收费托管 / 部署 / 定制 / 支持等）须先取得书面商业授权**；
- 对外分发或提供受覆盖作品时，须保留署名、许可证与来源信息，并**同步公开对应源码**；
- 历史 AGPL-3.0 与后续 LGPL-2.1 副本的既有权利均保留；捆绑 PDF.js 保持 Apache-2.0（见 [NOTICE.md](./NOTICE.md)）。

商用授权请在 [Issues](https://github.com/Guyao146/Resume-Smart-Filler-Assistant/issues) 发起申请（请勿在公开 Issue 中提交敏感资料）。

## v1.0.1 发布

本版本统一采用 Sakura-License v1.2，随发布包提供 LICENSE 与 NOTICE.md；历史和第三方授权保持不变。修复后台脚本重复模板尾部导致的语法错误，并恢复同版本完整 PDF.js worker，避免扩展加载失败。
