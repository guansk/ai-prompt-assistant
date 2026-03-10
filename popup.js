// Popup 页面逻辑
let allPrompts = [];
let filteredPrompts = [];

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchInput');
  const searchBox = document.getElementById('searchBox');
  const searchBtn = document.getElementById('searchBtn');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const goSettingsBtn = document.getElementById('goSettingsBtn');
  const retryBtn = document.getElementById('retryBtn');

  // 初始化
  await init();

  // 搜索按钮 - 展开搜索框
  searchBtn.addEventListener('click', () => {
    searchBox.style.display = 'flex';
    searchInput.focus();
    // 重新初始化图标
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });

  // 关闭搜索按钮
  closeSearchBtn.addEventListener('click', () => {
    searchBox.style.display = 'none';
    searchInput.value = '';
    filterPrompts('');
  });

  // ESC 键关闭搜索
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchBox.style.display = 'none';
      searchInput.value = '';
      filterPrompts('');
    }
  });

  // 搜索功能
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    filterPrompts(keyword);
  });

  // 刷新数据
  refreshBtn.addEventListener('click', async () => {
    // 清除表单状态，强制显示列表
    await chrome.storage.local.remove('currentFormPromptId');
    await loadPrompts(true);
    renderPrompts();
  });

  // 打开设置页面
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  goSettingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 重试
  retryBtn.addEventListener('click', async () => {
    await loadPrompts(true);
  });

  async function init() {
    // 检查配置
    const config = await chrome.storage.local.get(['appId', 'appSecret', 'appToken', 'tableId']);
    
    if (!config.appId || !config.appSecret || !config.appToken || !config.tableId) {
      showView('unconfigured');
      return;
    }

    // 检查是否有未完成的表单
    const formState = await chrome.storage.local.get(['currentFormPromptId']);
    
    // 加载数据
    await loadPrompts(false);
    
    // 数据加载完成后，决定显示什么
    if (formState.currentFormPromptId && allPrompts.length > 0) {
      // 有未完成的表单，恢复表单状态
      const prompt = allPrompts.find(p => p.id === formState.currentFormPromptId);
      if (prompt) {
        const variables = parseVariables(prompt.content);
        if (variables.length > 0) {
          await showVariableForm(prompt, variables);
          return; // 已显示表单，不再显示列表
        }
      }
    }
    
    // 没有未完成的表单，显示列表
    renderPrompts();
  }

  async function loadPrompts(forceRefresh) {
    try {
      showView('loading');
      refreshBtn.classList.add('loading');

      // 优先使用缓存
      if (!forceRefresh) {
        const cached = await chrome.storage.local.get(['cachedPrompts', 'cacheTime']);
        const cacheExpiry = 5 * 60 * 1000; // 5分钟
        
        if (cached.cachedPrompts && cached.cacheTime && (Date.now() - cached.cacheTime < cacheExpiry)) {
          allPrompts = cached.cachedPrompts;
          filteredPrompts = allPrompts;
          
          // 不立即渲染，让 init 函数决定是显示列表还是表单
          // renderPrompts();
          
          // 后台异步刷新
          fetchPromptsFromAPI().catch(console.error);
          return;
        }
      }

      // 从 API 获取
      await fetchPromptsFromAPI();
    } catch (error) {
      console.error('加载失败:', error);
      showView('error');
      document.getElementById('errorMessage').textContent = error.message;
    } finally {
      refreshBtn.classList.remove('loading');
    }
  }

  async function fetchPromptsFromAPI() {
    const config = await chrome.storage.local.get(['appId', 'appSecret', 'appToken', 'tableId', 'apiDomain']);

    // 使用保存的域名，或尝试两个域名
    const apiDomains = config.apiDomain 
      ? [config.apiDomain]
      : ['https://open.feishu.cn', 'https://open.larksuite.com'];

    let tokenData = null;
    let usedDomain = null;

    // 获取 access token
    for (const domain of apiDomains) {
      try {
        const tokenResponse = await fetch(`${domain}/open-apis/auth/v3/tenant_access_token/internal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app_id: config.appId,
            app_secret: config.appSecret
          })
        });

        if (!tokenResponse.ok) {
          continue;
        }

        const tokenText = await tokenResponse.text();
        
        try {
          tokenData = JSON.parse(tokenText);
          if (tokenData.code === 0) {
            usedDomain = domain;
            break;
          }
        } catch (e) {
          continue;
        }
      } catch (e) {
        continue;
      }
    }

    if (!tokenData || tokenData.code !== 0) {
      throw new Error('获取 Access Token 失败: ' + (tokenData?.msg || '请检查配置'));
    }

    const accessToken = tokenData.tenant_access_token;

    // 如果没有 tableId，获取第一个表格
    let finalTableId = config.tableId;
    
    if (!finalTableId) {
      console.log('未提供 Table ID，尝试获取第一个表格...');
      
      const tablesResponse = await fetch(
        `${usedDomain}/open-apis/bitable/v1/apps/${config.appToken}/tables?page_size=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!tablesResponse.ok) {
        throw new Error(`HTTP ${tablesResponse.status}: 获取表格列表失败`);
      }

      const tablesData = await tablesResponse.json();
      
      if (tablesData.code !== 0) {
        throw new Error(tablesData.msg || '获取表格列表失败');
      }

      if (!tablesData.data?.items || tablesData.data.items.length === 0) {
        throw new Error('多维表中没有找到任何表格');
      }

      finalTableId = tablesData.data.items[0].table_id;
      console.log('自动获取到第一个表格 ID:', finalTableId);
      
      // 保存自动获取的 tableId
      await chrome.storage.local.set({ tableId: finalTableId });
    }

    // 获取多维表数据
    const tableResponse = await fetch(
      `${usedDomain}/open-apis/bitable/v1/apps/${config.appToken}/tables/${finalTableId}/records?page_size=500`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!tableResponse.ok) {
      throw new Error(`HTTP ${tableResponse.status}: 读取多维表失败`);
    }

    const tableText = await tableResponse.text();
    let tableData;
    
    try {
      tableData = JSON.parse(tableText);
    } catch (e) {
      console.error('Table response:', tableText);
      throw new Error('多维表 API 返回格式错误');
    }

    if (tableData.code !== 0) {
      throw new Error('读取多维表失败: ' + (tableData.msg || '未知错误'));
    }

    // 解析数据
    const records = tableData.data?.items || [];
    allPrompts = records
      .map(record => {
        const fields = record.fields;
        return {
          id: record.record_id,
          title: fields.Title || '未命名',
          content: fields.Content || '',
          category: fields.Category || '',
          status: fields.Status || '启用'
        };
      })
      .filter(prompt => prompt.status === '启用' && prompt.content);

    // 缓存数据和域名
    await chrome.storage.local.set({
      cachedPrompts: allPrompts,
      cacheTime: Date.now(),
      apiDomain: usedDomain
    });

    filteredPrompts = allPrompts;
    
    // 不自动渲染，让调用者决定
    // renderPrompts();
  }

  function filterPrompts(keyword) {
    if (!keyword) {
      filteredPrompts = allPrompts;
    } else {
      filteredPrompts = allPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(keyword) ||
        prompt.content.toLowerCase().includes(keyword)
      );
    }
    renderPrompts();
  }

  function renderPrompts() {
    const listContainer = document.getElementById('promptList');
    
    if (filteredPrompts.length === 0) {
      showView('empty');
      return;
    }

    // 清空容器（使用更安全的方式）
    while (listContainer.firstChild) {
      listContainer.removeChild(listContainer.firstChild);
    }
    
    filteredPrompts.forEach(prompt => {
      const item = document.createElement('div');
      item.className = 'prompt-item';
      
      const titleDiv = document.createElement('div');
      titleDiv.className = 'prompt-title';
      titleDiv.textContent = prompt.title;
      
      // 检查是否有变量
      const variables = parseVariables(prompt.content);
      if (variables.length > 0) {
        const paramBadge = document.createElement('span');
        paramBadge.className = 'param-badge';
        paramBadge.textContent = `${variables.length} 个参数`;
        paramBadge.title = '此 Prompt 包含可填写的参数';
        titleDiv.appendChild(paramBadge);
      }
      
      if (prompt.category) {
        const categorySpan = document.createElement('span');
        categorySpan.className = 'prompt-category';
        categorySpan.textContent = prompt.category;
        titleDiv.appendChild(categorySpan);
      }
      
      const previewDiv = document.createElement('div');
      previewDiv.className = 'prompt-preview';
      previewDiv.textContent = prompt.content;
      
      item.appendChild(titleDiv);
      item.appendChild(previewDiv);
      
      // 点击填充
      item.addEventListener('click', async () => {
        await handlePromptClick(prompt);
      });
      
      listContainer.appendChild(item);
    });

    showView('list');
    
    // 初始化新添加的图标
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  async function handlePromptClick(prompt) {
    const variables = parseVariables(prompt.content);
    
    if (variables.length === 0) {
      // 无变量，直接填充
      await fillPrompt(prompt.content);
    } else {
      // 有变量，显示表单
      await showVariableForm(prompt, variables);
    }
  }

  function parseVariables(content) {
    const variables = [];
    // 匹配 [?变量名] 和 [变量名]
    const regex = /\[(\??[^\]]+)\]/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const varName = match[1];
      const isOptional = varName.startsWith('?');
      const cleanName = isOptional ? varName.substring(1) : varName;
      
      variables.push({
        placeholder: fullMatch,
        name: cleanName,
        required: !isOptional
      });
    }
    
    return variables;
  }

  async function showVariableForm(prompt, variables) {
    const formTitle = document.getElementById('formTitle');
    const formFields = document.getElementById('formFields');
    const confirmBtn = document.getElementById('confirmFillBtn');
    const cancelBtn = document.getElementById('cancelFormBtn');
    
    // 记住当前正在编辑的 prompt
    await chrome.storage.local.set({ currentFormPromptId: prompt.id });
    
    // 设置标题
    formTitle.textContent = prompt.title;
    
    // 清空表单字段
    while (formFields.firstChild) {
      formFields.removeChild(formFields.firstChild);
    }
    
    // 加载缓存的参数值
    const cacheKey = `paramCache_${prompt.id}`;
    const cached = await chrome.storage.local.get([cacheKey]);
    const cachedValues = cached[cacheKey] || {};
    
    // 生成表单字段
    variables.forEach((variable, index) => {
      const fieldGroup = document.createElement('div');
      fieldGroup.className = 'form-field';
      
      const label = document.createElement('label');
      label.className = 'form-label';
      label.htmlFor = `var-${index}`;
      
      // 构建标签文本
      const labelContent = variable.required 
        ? `${variable.name} *`
        : `${variable.name} (选填)`;
      label.textContent = labelContent;
      
      const textarea = document.createElement('textarea');
      textarea.id = `var-${index}`;
      textarea.className = 'form-input';
      textarea.placeholder = variable.required ? '请输入...' : '选填，可留空';
      textarea.rows = 3;
      textarea.dataset.varIndex = index;
      textarea.dataset.varName = variable.name;
      
      // 从缓存中恢复值
      const cachedValue = cachedValues[variable.name];
      if (cachedValue) {
        textarea.value = cachedValue;
      }
      
      // 实时保存到缓存（防止切换标签页丢失）
      textarea.addEventListener('input', async (e) => {
        const currentCache = await chrome.storage.local.get([cacheKey]);
        const currentValues = currentCache[cacheKey] || {};
        currentValues[variable.name] = e.target.value.trim();
        await chrome.storage.local.set({ [cacheKey]: currentValues });
      });
      
      fieldGroup.appendChild(label);
      fieldGroup.appendChild(textarea);
      formFields.appendChild(fieldGroup);
    });
    
    // 确认按钮事件
    confirmBtn.onclick = async () => {
      const values = [];
      const cacheData = {};
      let hasError = false;
      
      // 收集所有输入值
      variables.forEach((variable, index) => {
        const input = document.getElementById(`var-${index}`);
        const value = input.value.trim();
        
        // 验证必填项
        if (variable.required && !value) {
          input.classList.add('error');
          hasError = true;
        } else {
          input.classList.remove('error');
        }
        
        values.push(value);
        
        // 保存到缓存对象（包括空值，以便下次清空）
        cacheData[variable.name] = value;
      });
      
      if (hasError) {
        alert('请填写所有必填项');
        return;
      }
      
      // 保存参数值到缓存
      const cacheKey = `paramCache_${prompt.id}`;
      await chrome.storage.local.set({ [cacheKey]: cacheData });
      
      // 清除表单状态记录
      await chrome.storage.local.remove('currentFormPromptId');
      
      // 替换变量并填充
      let finalContent = prompt.content;
      variables.forEach((variable, index) => {
        const value = values[index];
        if (value) {
          // 有值，直接替换
          finalContent = finalContent.replace(variable.placeholder, value);
        } else {
          // 选填项为空，替换为"无"或删除
          finalContent = finalContent.replace(variable.placeholder, '无');
        }
      });
      
      await fillPrompt(finalContent);
    };
    
    // 取消按钮事件
    cancelBtn.onclick = async () => {
      // 清除表单状态记录
      await chrome.storage.local.remove('currentFormPromptId');
      showView('list');
    };
    
    // 清除缓存按钮事件
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    clearCacheBtn.onclick = async () => {
      const cacheKey = `paramCache_${prompt.id}`;
      await chrome.storage.local.remove(cacheKey);
      
      // 清空所有输入框
      variables.forEach((variable, index) => {
        const input = document.getElementById(`var-${index}`);
        if (input) {
          input.value = '';
        }
      });
    };
    
    // 显示表单视图
    showView('form');
    
    // 初始化新添加的图标
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  async function fillPrompt(content) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('无法获取当前标签页');
      }

      // 检查是否是支持的网站
      const supportedSites = ['chatgpt.com', 'openai.com', 'claude.ai', 'gemini.google.com', 'aistudio.google.com'];
      const isSupportedSite = supportedSites.some(site => tab.url.includes(site));
      
      if (!isSupportedSite) {
        alert('当前页面不支持自动填充\n支持的平台：ChatGPT、Claude、Gemini');
        return;
      }

      // 尝试发送消息到 content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'fillPrompt',
          content: content
        });
        
        // 关闭弹窗
        window.close();
      } catch (error) {
        // Content script 可能未注入，尝试手动注入
        console.log('Content script 未注入，尝试手动注入...');
        
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          // 等待一下让脚本初始化
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 再次尝试发送消息
          await chrome.tabs.sendMessage(tab.id, {
            action: 'fillPrompt',
            content: content
          });
          
          window.close();
        } catch (injectError) {
          console.error('注入失败:', injectError);
          alert('填充失败，请刷新页面后重试');
        }
      }
    } catch (error) {
      console.error('填充失败:', error);
      alert('填充失败: ' + error.message);
    }
  }

  function showView(viewName) {
    const views = {
      unconfigured: document.getElementById('unconfigured'),
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      list: document.getElementById('promptList'),
      empty: document.getElementById('empty'),
      form: document.getElementById('variableForm')
    };

    Object.values(views).forEach(view => {
      if (view) view.style.display = 'none';
    });

    if (viewName === 'list') {
      views.list.style.display = 'flex';
    } else if (viewName === 'form') {
      views.form.style.display = 'flex';
    } else if (views[viewName]) {
      views[viewName].style.display = 'flex';
    }
    
    // 初始化图标
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
});
