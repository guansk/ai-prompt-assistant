# 配置分享指南

## 功能说明

v1.2.0 版本新增了配置导出导入功能，方便团队成员快速配置和分享飞书多维表连接。

## 使用场景

### 场景一：团队管理员分享配置

1. 管理员配置好飞书应用和多维表
2. 在设置页面点击"导出配置"
3. 将下载的 JSON 文件分享给团队成员（通过邮件、飞书群等）
4. 团队成员点击"导入配置"，选择 JSON 文件
5. 配置自动填充并保存，立即可用

### 场景二：多环境配置切换

1. 为不同的项目或团队导出不同的配置文件
2. 需要切换时，导入对应的配置文件
3. 快速切换，无需手动输入

## 配置文件格式

导出的 JSON 文件包含以下信息：

```json
{
  "version": "1.0",
  "exportTime": "2026-03-10T12:00:00.000Z",
  "config": {
    "appId": "cli_xxxxxxxxxxxxxxxx",
    "appSecret": "your_app_secret_here",
    "bitableUrl": "https://xxx.feishu.cn/base/xxxxx",
    "appToken": "xxxxx",
    "tableId": "tblXXXXXXXXXXXXXX"
  }
}
```

### 字段说明

- `version`: 配置文件格式版本
- `exportTime`: 导出时间（ISO 8601 格式）
- `config.appId`: 飞书应用 ID
- `config.appSecret`: 飞书应用密钥
- `config.bitableUrl`: 多维表链接
- `config.appToken`: 多维表 App Token
- `config.tableId`: 表格 ID

### tableId 智能处理

**导出时：**
- 如果已有 tableId：直接导出
- 如果没有 tableId：
  - 自动尝试获取第一个表格的 ID
  - 获取成功后包含在导出文件中
  - 同时保存到本地，下次使用时直接用
  - 获取失败则导出 `null`，导入后会自动获取

**导入时：**
- 如果 `tableId` 有值：直接使用，无需额外请求
- 如果 `tableId` 为 `null`：使用时会自动获取并保存

**优势：**
- 导出的配置更完整，分享给团队成员后可直接使用
- 减少团队成员的 API 调用次数
- 提升配置分享的用户体验

## 安全提示

⚠️ **重要提示**：

1. 配置文件包含敏感信息（App Secret），请通过安全渠道分享
2. 不要将配置文件上传到公开的代码仓库
3. 建议通过企业内部通讯工具（如飞书）分享
4. 定期更换 App Secret，并重新分享配置

## 支持的链接格式

### 完整链接（推荐）

```
https://xxx.feishu.cn/base/PMgZbXR4davz22ssdmQcxDfQnjf?table=tblXXXXXXXXXXXXXX
```

- 明确指定使用哪个表格
- 适合多维表包含多个表格的情况

### 简化链接（v1.2 新增）

```
https://xxx.feishu.cn/base/PMgZbXR4davz22ssdmQcxDfQnjf
```

- 自动使用第一个表格
- 配置更简单
- 适合多维表只有一个表格的情况

## 常见问题

### Q: 导入配置后需要测试连接吗？

A: 建议导入后点击"测试连接"验证配置是否正确。

### Q: 可以手动编辑 JSON 文件吗？

A: 可以，但请确保 JSON 格式正确，且字段完整。

### Q: 导入配置会覆盖现有配置吗？

A: 是的，导入会完全覆盖现有配置。建议先导出当前配置作为备份。

### Q: 配置文件可以跨版本使用吗？

A: 目前支持 v1.0 格式，未来版本会保持向后兼容。

---

**版本：** v1.2.0  
**更新日期：** 2026-03-10
