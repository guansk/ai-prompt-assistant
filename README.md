# Team Prompt Manager - 团队 Prompt 管理浏览器插件

一款基于飞书多维表的轻量级 Chrome 浏览器插件，实现团队 Prompt 的统一管理和一键填充。

## ✨ 核心特性

- 🎯 **一键填充**：在 ChatGPT/Claude/Gemini 页面快速调用团队沉淀的 Prompt
- 📊 **飞书管理**：使用飞书多维表作为数据后台，无需开发管理系统
- 🔍 **快速搜索**：支持标题和内容的模糊搜索
- 🎨 **简洁设计**：现代化 UI，流畅的交互体验
- 💾 **智能缓存**：本地缓存机制，提升响应速度
- 🔒 **安全可靠**：敏感信息仅存储在本地浏览器

## 📸 界面预览

### 配置页面
简洁的配置界面，支持飞书 API 凭证配置和连接测试。

### Popup 弹窗
- 搜索框快速筛选
- 卡片式 Prompt 列表
- 分类标签展示
- 一键填充功能

## 📖 完整文档

- 📘 [项目概览](./项目概览.md) - 项目整体介绍
- 🚀 [快速开始](./快速开始.md) - 5分钟快速上手
- 📝 [安装指南](./安装指南.md) - 详细安装步骤
- 💡 [使用演示](./使用演示.md) - 实际使用场景
- 📊 [飞书多维表模板](./飞书多维表模板.md) - 数据表配置
- 🚢 [发布指南](./发布指南.md) - 发布到 Chrome Web Store
- ✅ [测试清单](./测试清单.md) - 完整测试规范
- 🤝 [贡献指南](./CONTRIBUTING.md) - 如何参与贡献

## 🚀 快速开始

### 1. 安装插件

```bash
# 克隆项目
git clone <repository-url>
cd team-prompt-manager

# 生成图标（可选）
# 在浏览器中打开 generate-icons.html，下载图标到 icons 目录

# 加载到 Chrome
# 1. 打开 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目根目录
```

### 2. 配置飞书

详细配置步骤请参考 [安装指南.md](./安装指南.md)

简要步骤：
1. 在飞书开放平台创建自建应用
2. 获取 App ID 和 App Secret
3. 创建多维表并配置字段（参考 [飞书多维表模板.md](./飞书多维表模板.md)）
4. 在插件设置页面填写配置信息

### 3. 开始使用

1. 打开 ChatGPT、Claude 或 Gemini 网站
2. 点击浏览器工具栏的插件图标
3. 搜索或浏览 Prompt 列表
4. 点击任意 Prompt 自动填充到输入框

## 📁 项目结构

```
team-prompt-manager/
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
├── 安装指南.md            # 详细安装说明
├── 飞书多维表模板.md      # 数据表配置模板
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
- [ ] 分类筛选功能
- [ ] 参数化 Prompt
- [ ] 反向收藏功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请查看：
- [安装指南.md](./安装指南.md) - 详细的安装和配置说明
- [飞书多维表模板.md](./飞书多维表模板.md) - 数据表配置和示例数据

---

Made with ❤️ for better team collaboration
