# AI Prompt 助手 - 飞书多维表驱动

用飞书多维表管理你的 Prompt 知识库，跨设备同步，随时调用。无论是个人知识管理还是团队协作，都能轻松搞定。

## ✨ 核心特性

- 📊 **飞书多维表驱动**：用熟悉的表格管理 Prompt，跨设备自动同步，无需额外系统
- 🎯 **一键调用**：在 ChatGPT/Claude/Gemini 页面快速填充你的 Prompt 库
- ✨ **参数化模板** (v1.1)：支持变量占位符，一个模板适配多种场景
- 🔗 **灵活链接** (v1.2)：支持简化的多维表链接，自动获取第一个表格
- 📤 **配置分享** (v1.2)：一键导出导入配置，团队协作更便捷
- 🔍 **快速搜索**：标题和内容的模糊搜索，秒找所需
- 🚀 **轻量极客**：Low-Code 理念，零学习成本，开箱即用
- 💼 **个人到团队**：从个人 PKM 到团队协作的无缝扩展
- 🔒 **安全可靠**：API 凭证仅存储在本地浏览器

## 🆕 v1.2 新特性

### 简化的多维表链接支持

现在支持两种链接格式：

**完整链接（推荐）：**
```
https://xxx.feishu.cn/base/xxxxx?table=xxxxx
```

**简化链接（新增）：**
```
https://xxx.feishu.cn/base/xxxxx
```

使用简化链接时，插件会自动获取多维表的第一个表格，配置更简单！

### 配置导出导入

团队协作更便捷：
- 点击"导出配置"生成 JSON 文件
- 分享给团队成员
- 团队成员点击"导入配置"即可使用

## 🆕 v1.1 新特性：参数化 Prompt

在 Prompt 中使用变量，让一个模板适配多种场景！

### 快速上手

**在飞书多维表的 Content 字段中：**

```
请将以下内容从 [源语言] 翻译成 [目标语言]：

专业领域：[?专业领域]

[待翻译内容]
```

**使用时：**
- 点击 Prompt 后弹出表单
- 填写变量（必填项带 ⭐ 标识）
- 点击确认，完整 Prompt 自动填入 AI 对话框

### 变量语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `[变量名]` | 必填变量 | `[编程语言]` |
| `[?变量名]` | 选填变量 | `[?代码功能]` |

### 更多信息

- 📘 [用户指南](./docs/USER_GUIDE.md) - 包含参数化 Prompt 详细说明
- 📊 [飞书配置](./docs/FEISHU_SETUP.md) - 包含参数化 Prompt 示例

## 📸 界面预览

### 配置页面
简洁的配置界面，支持飞书 API 凭证配置和连接测试。

### Popup 弹窗
- 搜索框快速筛选
- 卡片式 Prompt 列表
- 分类标签展示
- 一键填充功能

## 📖 完整文档

### 用户文档
- 📘 [用户指南](./docs/USER_GUIDE.md) - 安装、配置、使用完整指南
- 📊 [飞书配置](./docs/FEISHU_SETUP.md) - 飞书多维表配置和示例

### 开发文档
- 💻 [开发文档](./docs/DEVELOPMENT.md) - 项目结构、API、调试、测试
- 🤝 [贡献指南](./CONTRIBUTING.md) - 如何参与贡献

### 其他文档
- 📝 [更新日志](./CHANGELOG.md) - 版本更新记录
- 🔒 [隐私政策](./PRIVACY.md) - 隐私保护说明
- 🛡️ [安全说明](./SECURITY.md) - 安全审查报告
- 📋 [产品需求](./prd.md) - 产品需求文档

## 🚀 快速开始

### 1. 安装插件

```bash
# 克隆项目
git clone <repository-url>
cd ai-prompt-assistant

# 生成图标（可选）
# 在浏览器中打开 generate-icons.html，下载图标到 icons 目录

# 加载到 Chrome
# 1. 打开 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目根目录
```

### 2. 配置飞书

详细配置步骤请参考 [用户指南](./docs/USER_GUIDE.md)

简要步骤：
1. 在飞书开放平台创建自建应用
2. 获取 App ID 和 App Secret
3. 创建多维表并配置字段（参考 [飞书配置](./docs/FEISHU_SETUP.md)）
4. 在插件设置页面填写配置信息

### 3. 开始使用

1. 打开 ChatGPT、Claude 或 Gemini 网站
2. 点击浏览器工具栏的插件图标
3. 搜索或浏览 Prompt 列表
4. 点击任意 Prompt 自动填充到输入框

## 📁 项目结构

```
ai-prompt-assistant/
├── manifest.json           # 插件配置文件
├── popup.html             # 弹窗页面
├── popup.js               # 弹窗逻辑
├── options.html           # 设置页面
├── options.js             # 设置逻辑
├── content.js             # 内容脚本（网页注入）
├── styles/
│   ├── popup.css          # 弹窗样式
│   └── options.css        # 设置页样式
├── icons/                 # 图标文件
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── libs/
│   └── lucide.min.js      # 图标库
├── docs/                  # 文档目录
│   ├── README.md          # 文档索引
│   ├── USER_GUIDE.md      # 用户指南
│   ├── FEISHU_SETUP.md    # 飞书配置
│   └── DEVELOPMENT.md     # 开发文档
└── generate-icons.html    # 图标生成工具
```

## 🎨 设计特点

- **配色方案**：蓝色主题（#3b82f6），简洁专业
- **交互反馈**：Hover 态、点击动画、加载状态
- **响应式设计**：适配不同屏幕尺寸
- **状态管理**：清晰的空状态、错误状态、加载状态

## 🔧 技术栈

- Manifest V3
- 原生 JavaScript（无框架依赖）
- Chrome Extension APIs
- 飞书开放平台 API

## 📋 功能清单

- [x] 飞书 API 配置管理
- [x] 多维表数据读取
- [x] 本地数据缓存
- [x] Prompt 列表展示
- [x] 快速搜索功能
- [x] ChatGPT 页面注入
- [x] Claude 页面注入
- [x] Gemini 页面注入
- [x] Gemini AI Studio 页面注入
- [x] 分类标签展示
- [x] 状态筛选（启用/停用）
- [x] 参数化 Prompt（v1.1）
- [x] 必填/选填变量支持
- [x] 动态表单生成
- [x] 简化链接支持（v1.2）
- [x] 配置导出导入（v1.2）
- [ ] 分类筛选功能
- [ ] 反向收藏功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请查看：
- [用户指南](./docs/USER_GUIDE.md) - 详细的安装和配置说明
- [飞书配置](./docs/FEISHU_SETUP.md) - 数据表配置和示例数据
- [开发文档](./docs/DEVELOPMENT.md) - 调试和故障排查

---

Made with ❤️ for AI power users
