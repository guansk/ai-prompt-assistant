// 配置页面逻辑
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('configForm');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const messageDiv = document.getElementById('message');

  // 加载已保存的配置
  await loadConfig();

  // 监听多维表链接输入
  const bitableUrlInput = document.getElementById('bitableUrl');
  bitableUrlInput.addEventListener('input', (e) => {
    parseTableUrl(e.target.value.trim());
  });

  // 保存配置
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveConfig();
  });

  // 测试连接
  testBtn.addEventListener('click', async () => {
    await testConnection();
  });

  // 导出配置
  exportBtn.addEventListener('click', async () => {
    await exportConfig();
  });

  // 导入配置
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await importConfig(file);
      e.target.value = ''; // 清空文件选择
    }
  });

  async function loadConfig() {
    try {
      const config = await chrome.storage.local.get(['appId', 'appSecret', 'bitableUrl']);
      
      if (config.appId) document.getElementById('appId').value = config.appId;
      if (config.appSecret) document.getElementById('appSecret').value = config.appSecret;
      if (config.bitableUrl) document.getElementById('bitableUrl').value = config.bitableUrl;
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }

  function parseTableUrl(url) {
    if (!url) return { appToken: null, tableId: null };
    
    try {
      // 支持的 URL 格式：
      // 1. https://xxx.feishu.cn/base/bascnXXX?table=tblXXX
      // 2. https://xxx.larksuite.com/base/bascnXXX?table=tblXXX
      // 3. https://xxx.feishu.cn/base/PMgZbXR4davz22ssdmQcxDfQnjf (无 table 参数)
      
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;
      
      // 从路径中提取 App Token
      const pathMatch = pathname.match(/\/base\/([^\/\?]+)/);
      const appToken = pathMatch ? pathMatch[1] : null;
      
      // 从查询参数中提取 Table ID（可选）
      const tableId = searchParams.get('table') || null;
      
      return { appToken, tableId };
    } catch (error) {
      return { appToken: null, tableId: null };
    }
  }

  async function saveConfig() {
    const appId = document.getElementById('appId').value.trim();
    const appSecret = document.getElementById('appSecret').value.trim();
    const bitableUrl = document.getElementById('bitableUrl').value.trim();

    if (!appId || !appSecret || !bitableUrl) {
      showMessage('请填写所有必填项', 'error');
      return;
    }

    // 解析多维表链接
    const { appToken, tableId } = parseTableUrl(bitableUrl);
    
    if (!appToken) {
      showMessage('多维表链接格式不正确，请检查', 'error');
      return;
    }
    
    // tableId 可以为空，后续会自动获取第一个表格

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = '保存中...';

      await chrome.storage.local.set({
        appId,
        appSecret,
        bitableUrl,
        appToken,
        tableId
      });

      showMessage('配置保存成功！', 'success');
      saveBtn.textContent = '保存配置';
    } catch (error) {
      showMessage('保存失败: ' + error.message, 'error');
      saveBtn.textContent = '保存配置';
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function testConnection() {
    const appId = document.getElementById('appId').value.trim();
    const appSecret = document.getElementById('appSecret').value.trim();
    const bitableUrl = document.getElementById('bitableUrl').value.trim();

    if (!appId || !appSecret || !bitableUrl) {
      showMessage('请先填写所有配置项', 'error');
      return;
    }

    // 解析多维表链接
    const { appToken, tableId } = parseTableUrl(bitableUrl);
    
    if (!appToken) {
      showMessage('多维表链接格式不正确，请检查', 'error');
      return;
    }

    try {
      testBtn.disabled = true;
      testBtn.textContent = '测试中...';
      showMessage('正在测试连接...', 'info');

      // 尝试国内版和国际版的 API 端点
      const apiDomains = [
        'https://open.feishu.cn',
        'https://open.larksuite.com'
      ];

      let tokenData = null;
      let usedDomain = null;

      // 尝试获取 access token
      let lastError = null;
      
      for (const domain of apiDomains) {
        try {
          console.log(`尝试连接: ${domain}`);
          
          const tokenResponse = await fetch(`${domain}/open-apis/auth/v3/tenant_access_token/internal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              app_id: appId,
              app_secret: appSecret
            })
          });

          console.log(`响应状态: ${tokenResponse.status}`);

          if (!tokenResponse.ok) {
            lastError = `HTTP ${tokenResponse.status}`;
            continue; // 尝试下一个域名
          }

          const tokenText = await tokenResponse.text();
          console.log('Token 响应:', tokenText.substring(0, 200));
          
          try {
            tokenData = JSON.parse(tokenText);
            console.log('解析后的数据:', tokenData);
            
            if (tokenData.code === 0) {
              usedDomain = domain;
              console.log('✓ 成功获取 Token');
              break; // 成功，退出循环
            } else {
              lastError = tokenData.msg || `错误码: ${tokenData.code}`;
              console.log('API 返回错误:', lastError);
            }
          } catch (e) {
            lastError = 'JSON 解析失败';
            console.error('解析错误:', e);
            continue; // 尝试下一个域名
          }
        } catch (e) {
          lastError = e.message;
          console.error('请求错误:', e);
          continue; // 尝试下一个域名
        }
      }

      if (!tokenData || tokenData.code !== 0) {
        const errorMsg = lastError || '未知错误';
        throw new Error(`获取 Access Token 失败: ${errorMsg}\n\n请检查：\n1. App ID 和 App Secret 是否正确\n2. 应用是否已启用\n3. 网络连接是否正常`);
      }

      const accessToken = tokenData.tenant_access_token;

      // 如果没有 tableId，获取第一个表格
      let finalTableId = tableId;
      
      if (!finalTableId) {
        console.log('未提供 Table ID，尝试获取第一个表格...');
        
        const tablesResponse = await fetch(
          `${usedDomain}/open-apis/bitable/v1/apps/${appToken}/tables?page_size=1`,
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

      // 测试读取多维表
      const tableResponse = await fetch(
        `${usedDomain}/open-apis/bitable/v1/apps/${appToken}/tables/${finalTableId}/records?page_size=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!tableResponse.ok) {
        throw new Error(`HTTP ${tableResponse.status}: 读取多维表失败，请检查 App Token 和 Table ID`);
      }

      const tableText = await tableResponse.text();
      let tableData;
      
      try {
        tableData = JSON.parse(tableText);
      } catch (e) {
        console.error('Table response:', tableText);
        throw new Error('多维表 API 返回格式错误，请检查 App Token 和 Table ID 是否正确');
      }

      if (tableData.code !== 0) {
        throw new Error(tableData.msg || '读取多维表失败，请检查权限配置');
      }

      // 保存使用的域名
      await chrome.storage.local.set({ apiDomain: usedDomain });

      const tableIdMsg = tableId ? '' : `（自动使用第一个表格: ${finalTableId}）`;
      showMessage(`✓ 连接测试成功！使用 ${usedDomain === 'https://open.feishu.cn' ? '飞书' : 'Lark'} API ${tableIdMsg}`, 'success');
    } catch (error) {
      console.error('测试连接错误:', error);
      showMessage('连接测试失败: ' + error.message, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '测试连接';
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 3000);
    }
  }

  async function exportConfig() {
    try {
      const config = await chrome.storage.local.get(['appId', 'appSecret', 'bitableUrl', 'appToken', 'tableId']);
      
      if (!config.appId || !config.appSecret || !config.bitableUrl) {
        showMessage('没有可导出的配置，请先保存配置', 'error');
        return;
      }

      const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        config: {
          appId: config.appId,
          appSecret: config.appSecret,
          bitableUrl: config.bitableUrl,
          appToken: config.appToken,
          tableId: config.tableId || null
        }
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-prompt-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('✓ 配置已导出', 'success');
    } catch (error) {
      console.error('导出配置失败:', error);
      showMessage('导出失败: ' + error.message, 'error');
    }
  }

  async function importConfig(file) {
    try {
      const text = await file.text();
      let importData;
      
      try {
        importData = JSON.parse(text);
      } catch (e) {
        throw new Error('JSON 格式错误，请检查文件内容');
      }

      // 验证配置格式
      if (!importData.config || !importData.config.appId || !importData.config.appSecret || !importData.config.bitableUrl) {
        throw new Error('配置文件格式不正确，缺少必要字段');
      }

      // 填充表单
      document.getElementById('appId').value = importData.config.appId;
      document.getElementById('appSecret').value = importData.config.appSecret;
      document.getElementById('bitableUrl').value = importData.config.bitableUrl;

      // 保存到存储
      await chrome.storage.local.set({
        appId: importData.config.appId,
        appSecret: importData.config.appSecret,
        bitableUrl: importData.config.bitableUrl,
        appToken: importData.config.appToken,
        tableId: importData.config.tableId
      });

      showMessage('✓ 配置已导入并保存', 'success');
    } catch (error) {
      console.error('导入配置失败:', error);
      showMessage('导入失败: ' + error.message, 'error');
    }
  }
});
