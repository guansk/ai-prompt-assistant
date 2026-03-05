# 参数化 Prompt 功能流程图

## 整体流程

```
用户点击 Prompt
       ↓
  解析 Content
       ↓
    有变量？
    /      \
  是        否
  ↓         ↓
显示表单   直接填充
  ↓
用户填写
  ↓
点击确认
  ↓
验证必填项
  /      \
通过      失败
↓         ↓
替换变量  显示错误
↓
注入网页
↓
关闭弹窗
```

## 详细流程

### 1. 点击 Prompt 项

```javascript
// popup.js - renderPrompts()
item.addEventListener('click', async () => {
  await handlePromptClick(prompt);
});
```

### 2. 判断是否有变量

```javascript
// popup.js - handlePromptClick()
async function handlePromptClick(prompt) {
  const variables = parseVariables(prompt.content);
  
  if (variables.length === 0) {
    // 无变量 → 直接填充
    await fillPrompt(prompt.content);
  } else {
    // 有变量 → 显示表单
    showVariableForm(prompt, variables);
  }
}
```

### 3. 解析变量

```javascript
// popup.js - parseVariables()
function parseVariables(content) {
  const variables = [];
  const regex = /\[(\??[^\]]+)\]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];      // "[?参会方]"
    const varName = match[1];        // "?参会方"
    const isOptional = varName.startsWith('?');
    const cleanName = isOptional ? varName.substring(1) : varName;
    
    variables.push({
      placeholder: fullMatch,        // "[?参会方]"
      name: cleanName,               // "参会方"
      required: !isOptional          // false
    });
  }
  
  return variables;
}
```

**示例输入：**
```
参会方：[?参会方人员名单]
会议主题：[?本次会议的核心主题]
[待转录的文本]
```

**解析结果：**
```javascript
[
  {
    placeholder: "[?参会方人员名单]",
    name: "参会方人员名单",
    required: false
  },
  {
    placeholder: "[?本次会议的核心主题]",
    name: "本次会议的核心主题",
    required: false
  },
  {
    placeholder: "[待转录的文本]",
    name: "待转录的文本",
    required: true
  }
]
```

### 4. 生成表单

```javascript
// popup.js - showVariableForm()
function showVariableForm(prompt, variables) {
  // 设置标题
  formTitle.textContent = prompt.title;
  
  // 生成字段
  variables.forEach((variable, index) => {
    // 创建字段组
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-field';
    
    // 创建标签
    const label = document.createElement('label');
    if (variable.required) {
      // 必填：添加红色星号
      label.innerHTML = '<span class="required-mark">* </span>' + variable.name;
    } else {
      // 选填：添加灰色提示
      label.innerHTML = variable.name + '<span class="optional-mark"> (选填)</span>';
    }
    
    // 创建输入框
    const textarea = document.createElement('textarea');
    textarea.id = `var-${index}`;
    textarea.placeholder = variable.required ? '请输入...' : '选填，可留空';
    
    fieldGroup.appendChild(label);
    fieldGroup.appendChild(textarea);
    formFields.appendChild(fieldGroup);
  });
  
  // 显示表单视图
  showView('form');
}
```

**生成的表单 HTML：**
```html
<div class="variable-form">
  <div class="form-header">
    <h2 class="form-title">会议纪要生成器</h2>
  </div>
  <div class="form-body">
    <div class="form-fields">
      <!-- 选填字段 -->
      <div class="form-field">
        <label class="form-label">
          参会方人员名单
          <span class="optional-mark"> (选填)</span>
        </label>
        <textarea id="var-0" placeholder="选填，可留空"></textarea>
      </div>
      
      <!-- 必填字段 -->
      <div class="form-field">
        <label class="form-label">
          <span class="required-mark">* </span>
          待转录的文本
        </label>
        <textarea id="var-2" placeholder="请输入..."></textarea>
      </div>
    </div>
  </div>
  <div class="form-footer">
    <button class="btn-secondary">返回列表</button>
    <button class="btn-primary">确认生成并填入</button>
  </div>
</div>
```

### 5. 用户填写并提交

```javascript
// popup.js - confirmBtn.onclick
confirmBtn.onclick = async () => {
  const values = [];
  let hasError = false;
  
  // 收集所有输入值
  variables.forEach((variable, index) => {
    const input = document.getElementById(`var-${index}`);
    const value = input.value.trim();
    
    // 验证必填项
    if (variable.required && !value) {
      input.classList.add('error');  // 显示红色边框
      hasError = true;
    } else {
      input.classList.remove('error');
    }
    
    values.push(value);
  });
  
  // 如果有错误，阻止提交
  if (hasError) {
    alert('请填写所有必填项');
    return;
  }
  
  // 替换变量
  let finalContent = prompt.content;
  variables.forEach((variable, index) => {
    const value = values[index];
    if (value) {
      // 有值：直接替换
      finalContent = finalContent.replace(variable.placeholder, value);
    } else {
      // 选填项为空：替换为"无"
      finalContent = finalContent.replace(variable.placeholder, '无');
    }
  });
  
  // 注入网页
  await fillPrompt(finalContent);
};
```

**替换示例：**

**原始 Prompt：**
```
参会方：[?参会方人员名单]
会议主题：[?本次会议的核心主题]
[待转录的文本]
```

**用户输入：**
- 参会方人员名单：`甲方陈嵩、Josie；乙方朗翰高经理`
- 会议主题：（留空）
- 待转录的文本：`今天我们讨论了...`

**最终 Prompt：**
```
参会方：甲方陈嵩、Josie；乙方朗翰高经理
会议主题：无
今天我们讨论了...
```

### 6. 注入网页

```javascript
// popup.js - fillPrompt()
async function fillPrompt(content) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  await chrome.tabs.sendMessage(tab.id, {
    action: 'fillPrompt',
    content: content
  });
  
  window.close();  // 关闭弹窗
}
```

```javascript
// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillPrompt') {
    fillPromptToInput(request.content);
    sendResponse({ success: true });
  }
});
```

## 状态视图切换

```
showView(viewName)
       ↓
隐藏所有视图
       ↓
显示目标视图

视图列表：
- unconfigured  未配置
- loading       加载中
- error         错误
- list          Prompt 列表
- empty         空状态
- form          变量表单 ← 新增
```

## 数据流

```
飞书多维表
    ↓
  API 请求
    ↓
  JSON 数据
    ↓
  解析记录
    ↓
allPrompts 数组
    ↓
  用户点击
    ↓
parseVariables()
    ↓
variables 数组
    ↓
showVariableForm()
    ↓
  用户填写
    ↓
  values 数组
    ↓
  变量替换
    ↓
finalContent 字符串
    ↓
fillPrompt()
    ↓
  注入网页
```

## 错误处理流程

```
用户点击确认
       ↓
  遍历所有字段
       ↓
    必填项？
    /      \
  是        否
  ↓         ↓
有值？    收集值
/   \       ↓
是   否    继续
↓    ↓
收集  标记错误
↓    ↓
继续  hasError = true
     ↓
  有错误？
  /      \
是        否
↓         ↓
显示提示  执行替换
↓         ↓
阻止提交  注入网页
```

## 视觉反馈

### 必填项未填写
```css
.form-input.error {
  border-color: #ef4444;      /* 红色边框 */
  background: #fef2f2;        /* 浅红色背景 */
}
```

### 必填标记
```css
.required-mark {
  color: #ef4444;             /* 红色星号 */
}
```

### 选填标记
```css
.optional-mark {
  color: #9ca3af;             /* 灰色文字 */
}
```

## 兼容性处理

```
handlePromptClick(prompt)
         ↓
   parseVariables()
         ↓
   variables.length === 0?
      /            \
    是              否
    ↓               ↓
v1.0 行为        v1.1 行为
直接填充          显示表单
    ↓               ↓
fillPrompt()    showVariableForm()
```

## 总结

参数化 Prompt 功能通过以下关键步骤实现：

1. **解析**：正则表达式识别变量
2. **生成**：动态创建表单 DOM
3. **验证**：检查必填项
4. **替换**：拼接最终 Prompt
5. **注入**：发送到 AI 对话框

整个流程保持了良好的用户体验和代码可维护性。
