// Content Script - 网页注入逻辑
(function() {
  'use strict';

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fillPrompt') {
      fillPromptToInput(request.content);
      sendResponse({ success: true });
    }
    return true;
  });

  function fillPromptToInput(content) {
    const hostname = window.location.hostname;

    if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) {
      fillChatGPT(content);
    } else if (hostname.includes('claude.ai')) {
      fillClaude(content);
    } else if (hostname.includes('gemini.google.com')) {
      fillGemini(content);
    } else if (hostname.includes('aistudio.google.com')) {
      fillGeminiStudio(content);
    } else {
      console.warn('不支持的网站:', hostname);
    }
  }

  function fillChatGPT(content) {
    // ChatGPT 输入框选择器（支持多个版本）
    const selectors = [
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="消息"]',
      'textarea[placeholder*="Send a message"]',
      'div[contenteditable="true"][data-id]',
      'div[contenteditable="true"]'
    ];

    const input = findElement(selectors);

    if (!input) {
      console.error('未找到 ChatGPT 输入框');
      console.log('尝试的选择器:', selectors);
      alert('未找到输入框，页面可能已更新\n请刷新页面后重试');
      return;
    }

    console.log('找到输入框:', input);
    setInputValue(input, content);
  }

  function fillClaude(content) {
    // Claude 输入框选择器
    const selectors = [
      'div[contenteditable="true"][role="textbox"]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea'
    ];

    const input = findElement(selectors);

    if (!input) {
      console.error('未找到 Claude 输入框');
      console.log('尝试的选择器:', selectors);
      alert('未找到输入框，页面可能已更新\n请刷新页面后重试');
      return;
    }

    console.log('找到输入框:', input);
    setInputValue(input, content);
  }

  function fillGemini(content) {
    // Gemini 输入框选择器
    const selectors = [
      'rich-textarea[placeholder*="Enter a prompt"]',
      'rich-textarea',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Enter a prompt"]',
      'textarea'
    ];

    const input = findElement(selectors);

    if (!input) {
      console.error('未找到 Gemini 输入框');
      console.log('尝试的选择器:', selectors);
      alert('未找到输入框，页面可能已更新\n请刷新页面后重试');
      return;
    }

    console.log('找到输入框:', input);
    
    // Gemini 使用 rich-textarea 组件，需要特殊处理
    if (input.tagName.toLowerCase() === 'rich-textarea') {
      // 尝试找到内部的可编辑元素
      const editableDiv = input.querySelector('div[contenteditable="true"]');
      if (editableDiv) {
        setInputValue(editableDiv, content);
      } else {
        // 直接设置 rich-textarea 的值
        input.value = content;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      setInputValue(input, content);
    }
  }

  function fillGeminiStudio(content) {
    // Gemini AI Studio 输入框选择器
    const selectors = [
      'textarea[aria-label*="prompt"]',
      'textarea[placeholder*="Enter a prompt"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea'
    ];

    const input = findElement(selectors);

    if (!input) {
      console.error('未找到 Gemini AI Studio 输入框');
      console.log('尝试的选择器:', selectors);
      alert('未找到输入框，页面可能已更新\n请刷新页面后重试');
      return;
    }

    console.log('找到输入框:', input);
    setInputValue(input, content);
  }

  function findElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }

  function setInputValue(element, value) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      // 标准输入框
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element.contentEditable === 'true') {
      // contenteditable 元素
      element.focus();
      
      // 清空现有内容
      element.textContent = '';
      
      // 插入新内容
      const textNode = document.createTextNode(value);
      element.appendChild(textNode);
      
      // 触发输入事件
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 移动光标到末尾
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // 聚焦元素
    element.focus();
  }
})();
