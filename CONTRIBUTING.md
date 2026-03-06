# 贡献指南

感谢你考虑为 Team Prompt Manager 做出贡献！

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 Issue，包含以下信息：

- **Bug 描述**：清晰简洁地描述问题
- **复现步骤**：详细的复现步骤
- **期望行为**：你期望发生什么
- **实际行为**：实际发生了什么
- **环境信息**：
  - Chrome 版本
  - 操作系统
  - 插件版本
- **截图**：如果适用，添加截图帮助说明问题

### 提出新功能

如果你有新功能的想法，请创建一个 Issue，包含：

- **功能描述**：清晰描述你想要的功能
- **使用场景**：为什么需要这个功能
- **实现建议**：如果有的话，提供实现思路

### 提交代码

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目
   git clone https://github.com/your-username/team-prompt-manager.git
   cd team-prompt-manager
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **进行修改**
   - 遵循现有的代码风格
   - 添加必要的注释
   - 确保代码可以正常运行

4. **测试修改**
   - 在 Chrome 中加载插件测试
   - 确保没有破坏现有功能
   - 参考 [开发文档 - 测试清单](./docs/DEVELOPMENT.md#测试清单)

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   # 或
   git commit -m "fix: 修复某个问题"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关

6. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 清晰描述你的修改
   - 关联相关的 Issue

## 代码规范

### JavaScript 规范

- 使用 2 空格缩进
- 使用单引号
- 语句末尾加分号
- 使用 `const` 和 `let`，避免 `var`
- 使用箭头函数
- 添加必要的注释

示例：
```javascript
// 好的示例
const fetchData = async () => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
};

// 不好的示例
var fetchData = function() {
  fetch(url).then(function(response) {
    return response.json()
  }).then(function(data) {
    return data
  })
}
```

### CSS 规范

- 使用类选择器，避免 ID 选择器
- 使用有意义的类名
- 按功能组织样式
- 添加必要的注释

示例：
```css
/* 好的示例 */
.prompt-item {
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.prompt-item:hover {
  border-color: #3b82f6;
  background: #f9fafb;
}

/* 不好的示例 */
#item {
  padding: 14px 16px;
}
```

### HTML 规范

- 使用语义化标签
- 添加必要的 ARIA 属性
- 保持结构清晰

## 项目结构

```
team-prompt-manager/
├── manifest.json          # 插件配置
├── popup.html/js/css      # 弹窗界面
├── options.html/js/css    # 设置页面
├── content.js             # 内容脚本
├── styles/                # 样式文件
├── icons/                 # 图标资源
└── docs/                  # 文档
```

## 开发流程

1. **本地开发**
   ```bash
   # 加载插件到 Chrome
   # chrome://extensions/ -> 开发者模式 -> 加载已解压的扩展程序
   ```

2. **调试**
   - Popup 页面：右键插件图标 -> 检查弹出内容
   - Options 页面：在选项页面右键 -> 检查
   - Content Script：在目标网页打开开发者工具
   - Background：在扩展程序页面点击"检查视图"

3. **测试**
   - 参考 [开发文档 - 测试清单](./docs/DEVELOPMENT.md#测试清单)
   - 确保所有功能正常工作
   - 测试边界情况

4. **提交**
   - 遵循提交信息规范
   - 一次提交只做一件事
   - 提交前检查代码

## 文档贡献

文档同样重要！你可以：

- 修正错别字
- 改进说明的清晰度
- 添加使用示例
- 翻译文档

## 社区准则

- 尊重他人
- 保持友好和专业
- 接受建设性的批评
- 关注对项目最有利的事情

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

## 相关文档

- [用户指南](./docs/USER_GUIDE.md) - 了解功能使用
- [开发文档](./docs/DEVELOPMENT.md) - 技术细节和调试
- [飞书配置](./docs/FEISHU_SETUP.md) - 数据表配置

## 问题？

如果你有任何问题，可以：

- 创建 Issue 讨论
- 查看现有的 Issue 和 Pull Request
- 阅读项目文档

---

再次感谢你的贡献！🎉
