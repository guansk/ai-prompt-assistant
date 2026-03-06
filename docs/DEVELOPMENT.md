# 开发文档

## 项目概述

Team Prompt Manager 是一款基于飞书多维表的 Chrome 浏览器插件，用于团队 Prompt 的统一管理和一键填充。

### 技术栈

- Manifest V3
- 原生 JavaScript（无框架依赖）
- CSS3
- 飞书开放平台 API
- Lucide Icons

### 项目结构

```
ai-prompt-assistant/
├── manifest.json          # 插件配置
├── popup.html/js          # 弹窗界面
├── options.html/js        # 设置页面
├── content.js             # 内容脚本
├── styles/
│   ├── popup.css          # 弹窗样式
│   └── options.css        # 设置样式
├── icons/                 # 图标资源
├── libs/
│   └── lucide.min.js      # 图标库
└── docs/                  # 文档
```

---

## 核心功能

### 1. 配置管理

**文件**：`options.html`, `options.js`

**功能**：
- 飞书 API 凭证配置
- 多维表数据源配置
- 连接测试
- 本地存储

**存储结构**：
```javascript
{
  appId: 'cli_xxx',
  appSecret: 'xxx',
  appToken: 'bascnxxx',
  tableId: 'tblxxx',
  apiDomain: 'feishu' // 或 'larksuite'
}
```

### 2. 数据管理

**文件**：`popup.js`

**功能**：
- 从飞书多维表读取数据
- 智能缓存机制（5分钟）
- 手动刷新
- 状态筛选

**数据流程**：
```
1. 检查本地缓存
2. 缓存有效 → 直接使用
3. 缓存无效 → 请求飞书 API
4. 解析数据
5. 更新缓存
6. 展示列表
```

### 3. 内容注入

**文件**：`content.js`

**功能**：
- 监听来自 popup 的消息
- 定位目标网站的输入框
- 填充 Prompt 内容
- 触发输入事件

**支持的网站**：
- ChatGPT (chatgpt.com, chat.openai.com)
- Claude (claude.ai)
- Gemini (gemini.google.com, aistudio.google.com)

---

## API 集成

### 飞书 API

#### 1. 获取 Access Token

```javascript
const response = await fetch(`${apiBase}/open-api/auth/v3/tenant_access_token/internal`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    app_id: appId,
    app_secret: appSecret
  })
});
```

#### 2. 读取多维表数据

```javascript
const response = await fetch(
  `${apiBase}/open-api/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

#### 3. 数据解析

```javascript
const prompts = data.data.items.map(item => ({
  title: item.fields.Title || '',
  content: item.fields.Content || '',
  category: item.fields.Category || '',
  status: item.fields.Status || '启用'
}));
```

---

## 调试指南

### 查看日志

**Popup 页面**：
1. 点击插件图标
2. 右键弹窗 → 检查
3. 查看 Console

**Options 页面**：
1. 右键插件图标 → 选项
2. 右键页面 → 检查
3. 查看 Console

**Content Script**：
1. 在目标网页按 F12
2. 查看 Console
3. 查找插件相关日志

### 常见问题

#### 连接测试失败

**排查步骤**：
1. 检查 App ID 和 App Secret
2. 确认应用已开通多维表权限
3. 查看 Console 错误信息
4. 检查网络请求

#### 内容注入失败

**排查步骤**：
1. 确认当前页面是支持的 AI 平台
2. 检查 Content Script 是否注入
3. 查看输入框选择器是否有效
4. 检查 Console 错误

#### 数据不同步

**排查步骤**：
1. 检查缓存时间
2. 手动刷新数据
3. 验证飞书多维表配置
4. 检查 API 响应

### 清除缓存

```javascript
// 在 Console 中执行
chrome.storage.local.remove(['cachedPrompts', 'cacheTime'], () => {
  console.log('缓存已清除');
});
```

### 查看存储数据

```javascript
// 在 Console 中执行
chrome.storage.local.get(null, (data) => {
  console.log('存储的数据:', data);
});
```

---

## 测试清单

### 基础功能测试

- [ ] 插件可以加载
- [ ] 配置页面正常
- [ ] 连接测试成功
- [ ] Popup 可以打开
- [ ] 数据正常显示
- [ ] 搜索功能正常
- [ ] ChatGPT 填充正常
- [ ] Claude 填充正常
- [ ] Gemini 填充正常

### 边界情况测试

- [ ] 空配置提示
- [ ] 错误配置提示
- [ ] 空数据提示
- [ ] 网络错误提示
- [ ] 超长内容处理
- [ ] 特殊字符处理

### 性能测试

- [ ] 100+ Prompt 加载正常
- [ ] 搜索响应及时
- [ ] 滚动流畅
- [ ] 内存占用合理

### 兼容性测试

- [ ] Chrome 最新版本
- [ ] Chrome 88+
- [ ] Windows
- [ ] macOS
- [ ] Linux

---

## 代码规范

### JavaScript

- 使用 2 空格缩进
- 使用单引号
- 语句末尾加分号
- 使用 `const` 和 `let`
- 使用箭头函数
- 添加必要注释

### CSS

- 使用类选择器
- 使用有意义的类名
- 按功能组织样式
- 添加必要注释

### HTML

- 使用语义化标签
- 添加必要的 ARIA 属性
- 保持结构清晰

---

## 性能优化

### 缓存策略

- 5分钟缓存过期
- 手动刷新立即更新
- 缓存失效自动重新请求

### 搜索优化

- 实时搜索
- 模糊匹配
- 大小写不敏感

### 渲染优化

- 虚拟滚动（如需要）
- 防抖搜索
- 懒加载图片

---

## 安全考虑

### 数据安全

- 敏感信息仅存储在本地
- HTTPS 加密传输
- 最小权限原则

### 隐私保护

- 不收集用户数据
- 不向第三方发送数据
- 代码开源可审计

---

## 发布流程

### 1. 版本更新

1. 更新 `manifest.json` 中的版本号
2. 更新 `CHANGELOG.md`
3. 提交代码

### 2. 打包

```bash
# 创建发布目录
mkdir release

# 复制必要文件
cp -r icons libs styles *.html *.js *.json release/

# 创建 zip 包
cd release
zip -r ../team-prompt-manager-v1.1.0.zip *
```

### 3. 测试

1. 在 Chrome 中加载打包后的插件
2. 完整测试所有功能
3. 确认无错误

### 4. 发布

1. 登录 Chrome Web Store
2. 上传 zip 包
3. 填写更新说明
4. 提交审核

---

## 贡献指南

### 报告 Bug

创建 Issue，包含：
- Bug 描述
- 复现步骤
- 期望行为
- 实际行为
- 环境信息
- 截图

### 提出功能

创建 Issue，包含：
- 功能描述
- 使用场景
- 实现建议

### 提交代码

1. Fork 项目
2. 创建分支
3. 进行修改
4. 测试修改
5. 提交更改
6. 推送到 GitHub
7. 创建 Pull Request

---

## 参考资料

- [Chrome Extension 文档](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [飞书开放平台文档](https://open.feishu.cn/document/)
- [Lucide Icons](https://lucide.dev/)

