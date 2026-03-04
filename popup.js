// Popup 页面逻辑
let allPrompts = [];
let filteredPrompts = [];

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const goSettingsBtn = document.getElementById('goSettingsBtn');
  const retryBtn = document.getElementById('retryBtn');

  // 初始化
  await init();

  // 搜索功能
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    filterPrompts(keyword);
  });

  // 刷新数据
  refreshBtn.addEventListener('click', async () => {
    await loadPrompts(true);
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

    // 加载数据
    await loadPrompts(false);
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
          renderPrompts();
          
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

    // 获取多维表数据
    const tableResponse = await fetch(
      `${usedDomain}/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?page_size=500`,
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
    renderPrompts();
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
        await fillPrompt(prompt.content);
      });
      
      listContainer.appendChild(item);
    });

    showView('list');
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
      empty: document.getElementById('empty')
    };

    Object.values(views).forEach(view => {
      if (view) view.style.display = 'none';
    });

    if (viewName === 'list') {
      views.list.style.display = 'flex';
    } else if (views[viewName]) {
      views[viewName].style.display = 'flex';
    }
  }
});
