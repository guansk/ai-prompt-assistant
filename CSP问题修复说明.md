# CSP 问题修复说明

## 问题描述

在加载 Chrome 扩展时遇到错误：

```
'content_security_policy.extension_pages': Insecure CSP value "https://unpkg.com" in directive 'script-src'.
```

## 原因分析

Chrome 扩展的内容安全策略（CSP）不允许从外部 CDN 加载脚本，只能使用：
- `'self'` - 本地文件
- `'wasm-unsafe-eval'` - WebAssembly（特殊情况）

不能使用：
- ❌ 外部 CDN（如 `https://unpkg.com`）
- ❌ `'unsafe-inline'`
- ❌ `'unsafe-eval'`

## 解决方案

### 1. 下载图标库到本地

```bash
# 创建 libs 目录
mkdir libs

# 下载 Lucide Icons
curl -o libs/lucide.min.js https://unpkg.com/lucide@latest/dist/umd/lucide.min.js
```

### 2. 更新 HTML 引用

**popup.html 和 options.html：**

```html
<!-- ❌ 错误的做法 -->
<script src="https://unpkg.com/lucide@latest"></script>

<!-- ✅ 正确的做法 -->
<script src="libs/lucide.min.js"></script>
```

### 3. 保持 CSP 策略

**manifest.json：**

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

## 已完成的修复

✅ 下载 `lucide.min.js` 到 `libs/` 目录（398KB）  
✅ 更新 `popup.html` 引用本地文件  
✅ 更新 `options.html` 引用本地文件  
✅ 恢复 `manifest.json` CSP 策略为 `'self'`  
✅ 更新相关文档  

## 验证修复

### 1. 检查文件结构

```
ai-prompt-assistant/
├── libs/
│   └── lucide.min.js  ← 应该存在，约 398KB
├── popup.html
├── options.html
└── manifest.json
```

### 2. 检查 HTML 引用

在 `popup.html` 和 `options.html` 中应该看到：

```html
<script src="libs/lucide.min.js"></script>
```

### 3. 检查 manifest.json

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### 4. 重新加载扩展

1. 打开 Chrome 扩展管理页面：`chrome://extensions/`
2. 点击"重新加载"按钮
3. 应该不再有 CSP 错误
4. 点击扩展图标，检查图标是否正常显示

## 优势对比

### CDN 方案 vs 本地文件

| 特性 | CDN | 本地文件 |
|------|-----|---------|
| Chrome 扩展兼容 | ❌ | ✅ |
| 离线可用 | ❌ | ✅ |
| 加载速度 | 慢（网络） | 快（本地） |
| 包体积 | 0 | +398KB |
| 版本控制 | 自动更新 | 手动更新 |
| 稳定性 | 依赖外部 | 完全可控 |

## 其他注意事项

### 1. 测试页面可以使用 CDN

`test-icons.html` 不是扩展的一部分，可以继续使用 CDN：

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

### 2. 更新图标库版本

如需更新到最新版本：

```bash
curl -o libs/lucide.min.js https://unpkg.com/lucide@latest/dist/umd/lucide.min.js
```

或指定版本：

```bash
curl -o libs/lucide.min.js https://unpkg.com/lucide@0.263.1/dist/umd/lucide.min.js
```

### 3. 包体积优化

如果担心包体积，可以考虑：
- 使用 SVG Sprite（只包含需要的图标）
- 使用图标字体
- 回退到 Emoji（0KB，但不够专业）

但对于 Chrome 扩展来说，398KB 是可以接受的。

## 常见 CSP 错误

### 错误 1：使用外部 CDN

```json
// ❌ 错误
"content_security_policy": {
  "extension_pages": "script-src 'self' https://unpkg.com; object-src 'self'"
}
```

**解决**：下载到本地，只使用 `'self'`

### 错误 2：使用 unsafe-inline

```json
// ❌ 错误
"content_security_policy": {
  "extension_pages": "script-src 'self' 'unsafe-inline'; object-src 'self'"
}
```

**解决**：将内联脚本移到单独的 JS 文件

### 错误 3：使用 unsafe-eval

```json
// ❌ 错误
"content_security_policy": {
  "extension_pages": "script-src 'self' 'unsafe-eval'; object-src 'self'"
}
```

**解决**：避免使用 `eval()`、`new Function()` 等

## 参考资料

- [Chrome 扩展 CSP 文档](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/)
- [Lucide Icons 官网](https://lucide.dev/)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 总结

✅ 问题已解决  
✅ 使用本地文件替代 CDN  
✅ 符合 Chrome 扩展 CSP 要求  
✅ 完全离线可用  
✅ 加载速度更快  

现在可以正常加载扩展了！
