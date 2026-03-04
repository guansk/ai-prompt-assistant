// 配置页面逻辑
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('configForm');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
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
      // https://xxx.feishu.cn/base/bascnXXX?table=tblXXX
      // https://xxx.larksuite.com/base/bascnXXX?table=tblXXX
      
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;
      
      // 从路径中提取 App Token
      const pathMatch = pathname.match(/\/base\/([^\/\?]+)/);
      const appToken = pathMatch ? pathMatch[1] : null;
      
      // 从查询参数中提取 Table ID
      const tableId = searchParams.get('table');
      
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
    
    if (!appToken || !tableId) {
      showMessage('多维表链接格式不正确，请检查', 'error');
      return;
    }

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
    
    if (!appToken || !tableId) {
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

      // 测试读取多维表
      const tableResponse = await fetch(
        `${usedDomain}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=1`,
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

      showMessage(`✓ 连接测试成功！使用 ${usedDomain === 'https://open.feishu.cn' ? '飞书' : 'Lark'} API`, 'success');
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
});
