/**
 * AI Resume Autofill - Popup Script
 * Handles resume upload, settings, and triggers form filling
 */

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const manualPasteBtn = document.getElementById('manualPasteBtn');
const pasteSection = document.getElementById('pasteSection');
const closePasteBtn = document.getElementById('closePaste');
const resumeTextarea = document.getElementById('resumeTextarea');
const saveTextResumeBtn = document.getElementById('saveTextResume');
const clearPasteBtn = document.getElementById('clearPaste');
const resumeSection = document.getElementById('resumeSection');
const resumeName = document.getElementById('resumeName');
const resumeSize = document.getElementById('resumeSize');
const deleteResumeBtn = document.getElementById('deleteResume');
const togglePreview = document.getElementById('togglePreview');
const previewContent = document.getElementById('previewContent');
const parsedInfo = document.getElementById('parsedInfo');
const scanBtn = document.getElementById('scanBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const aiProvider = document.getElementById('aiProvider');
const apiKey = document.getElementById('apiKey');
const customEndpointGroup = document.getElementById('customEndpointGroup');
const customEndpoint = document.getElementById('customEndpoint');
const modelSelect = document.getElementById('modelSelect');
const saveSettingsBtn = document.getElementById('saveSettings');
const cancelSettingsBtn = document.getElementById('cancelSettings');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const totalFields = document.getElementById('totalFields');
const filledFields = document.getElementById('filledFields');
const unmatchedFields = document.getElementById('unmatchedFields');
const unmatchedList = document.getElementById('unmatchedList');
const fillManuallyBtn = document.getElementById('fillManually');
const statusMessage = document.getElementById('statusMessage');

// State
let currentResume = null;
let isSettingsOpen = false;

// Initialize
(async () => {
  await loadResume();
  await loadSettings();
  setupEventListeners();
})();

// ====== Event Listeners ======

function setupEventListeners() {
  // Upload
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  fileInput.addEventListener('change', handleFileSelect);

  // Manual paste
  manualPasteBtn.addEventListener('click', openPasteSection);
  closePasteBtn.addEventListener('click', closePasteSection);
  saveTextResumeBtn.addEventListener('click', saveTextResume);
  clearPasteBtn.addEventListener('click', () => {
    resumeTextarea.value = '';
  });

  // Resume management
  deleteResumeBtn.addEventListener('click', deleteResume);
  togglePreview.addEventListener('click', () => {
    previewContent.classList.toggle('collapsed');
    togglePreview.textContent = previewContent.classList.contains('collapsed') ? '展开' : '收起';
  });

  // Actions
  scanBtn.addEventListener('click', startScanAndFill);
  settingsBtn.addEventListener('click', toggleSettings);
  fillManuallyBtn.addEventListener('click', openManualFill);

  // Settings
  aiProvider.addEventListener('change', updateModelOptions);
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
    isSettingsOpen = false;
  });
}

// ====== Upload Functions ======

function handleDragOver(e) {
  e.preventDefault();
  dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

async function processFile(file) {
  const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const validExtensions = ['.pdf', '.txt', '.doc', '.docx'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
    showStatus('不支持的文件格式，请上传 PDF、Word 或 TXT 文件', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showStatus('文件大小超过 10MB 限制', 'error');
    return;
  }

  showStatus('正在解析简历...', 'info');

  try {
    const text = await extractText(file);
    console.log('[AI Resume] Extracted text length:', text.length);
    console.log('[AI Resume] Text preview (first 300 chars):', text.substring(0, 300));
    
    if (!text || text.trim().length < 50) {
      showStatus('文件提取的文本过少，可能是加密或扫描版PDF。请使用「手动粘贴简历文本」', 'error');
      setTimeout(() => {
        openPasteSection();
      }, 1500);
    }
    
    const parsed = await parseResume(text);
    console.log('[AI Resume] Parsed resume:', JSON.stringify(parsed));
    
    currentResume = {
      name: file.name,
      size: formatFileSize(file.size),
      text: text,
      parsed: parsed,
      timestamp: Date.now()
    };

    await chrome.storage.local.set({ resume: currentResume });
    showStatus('简历上传成功！', 'success');
    updateUI();
  } catch (error) {
    console.error('Parse error:', error);
    showStatus('简历解析失败：' + error.message, 'error');
  }
}

// ====== Manual Paste Functions ======

function openPasteSection() {
  pasteSection.classList.remove('hidden');
  uploadSection.classList.add('hidden');
  resumeTextarea.focus();
}

function closePasteSection() {
  pasteSection.classList.add('hidden');
  if (!currentResume) {
    uploadSection.classList.remove('hidden');
  }
}

async function saveTextResume() {
  const text = resumeTextarea.value.trim();
  if (!text || text.length < 20) {
    showStatus('简历内容太短，请至少输入 20 个字符', 'error');
    return;
  }

  showStatus('正在解析简历...', 'info');

  try {
    const parsed = await parseResume(text);
    console.log('[AI Resume] Manual paste parsed:', JSON.stringify(parsed));

    currentResume = {
      name: '手动粘贴的简历',
      size: formatFileSize(new Blob([text]).size),
      text: text,
      parsed: parsed,
      timestamp: Date.now()
    };

    await chrome.storage.local.set({ resume: currentResume });
    showStatus('简历保存成功！', 'success');
    updateUI();
    pasteSection.classList.add('hidden');
  } catch (error) {
    console.error('Parse error:', error);
    showStatus('简历解析失败：' + error.message, 'error');
  }
}

async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (ext === 'txt') {
    return await file.text();
  }
  
  if (ext === 'pdf') {
    return await extractPDFText(file);
  }
  
  // For Word docs, try to extract text using simple approach
  // In a real implementation, you'd use mammoth.js or similar
  if (ext === 'doc' || ext === 'docx') {
    return await extractWordText(file);
  }
  
  return await file.text();
}

async function extractPDFText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const typedArray = new Uint8Array(e.target.result);
        // Use pdf-parse if available (loaded as library)
        if (typeof pdfjsLib !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
          }
          resolve(text);
        } else {
          // Fallback: try to extract text from raw PDF bytes (very basic)
          const text = extractTextFromRawPDF(typedArray);
          resolve(text);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function extractTextFromRawPDF(uint8Array) {
  // 尝试多种方式从 PDF 原始字节中提取可读文本
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(uint8Array);
  let result = '';
  
  // 策略 1：提取括号内的文本 (Tj 操作符)，常见于中文 PDF
  const parenRegex = /\(([^()]{1,500})\)/g;
  let parenMatch;
  while ((parenMatch = parenRegex.exec(text)) !== null) {
    const content = parenMatch[1].trim();
    // 允许中文、英文、数字、空格及常见标点
    if (/^[\u4e00-\u9fa5a-zA-Z0-9\s\-._@+，。、；""''（）【\]\uff0c\u3002\u3001\uff1b\uff1a\uff08\uff09\u3010\u3011\u4e00-\u9fff]+$/.test(content)) {
      result += content + ' ';
    }
  }
  
  // 策略 2：提取 UTF-16BE 编码的十六进制字符串 (<...>)，很多中文 PDF 使用
  if (result.length < 200) {
    const hexRegex = /<([0-9A-Fa-f]{8,4000})>/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(text)) !== null) {
      const hex = hexMatch[1];
      if (hex.length % 4 === 0) {
        try {
          const bytes = new Uint8Array(hex.length / 2);
          for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
          }
          const decoded = new TextDecoder('utf-16be').decode(bytes);
          if (decoded.replace(/\s/g, '').length > 2) {
            result += decoded + ' ';
          }
        } catch (e) {}
      }
    }
  }
  
  // 策略 3：提取所有连续中文字符（如果前两种都失败）
  if (result.length < 200) {
    const cnRegex = /[\u4e00-\u9fa5]{2,50}/g;
    let cnMatch;
    while ((cnMatch = cnRegex.exec(text)) !== null) {
      result += cnMatch[0] + ' ';
    }
  }
  
  // 策略 4：提取邮箱和电话号码（作为备用）
  if (result.length < 200) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let emailMatch;
    while ((emailMatch = emailRegex.exec(text)) !== null) {
      result += emailMatch[0] + ' ';
    }
    const phoneRegex = /[\+]?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{4,}/g;
    let phoneMatch;
    while ((phoneMatch = phoneRegex.exec(text)) !== null) {
      result += phoneMatch[0] + ' ';
    }
  }
  
  return result.length > 10 ? result : text.substring(0, 8000);
}

async function extractWordText(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  
  if (ext === 'docx') {
    // .docx is a ZIP archive containing XML; try to extract <w:t> text nodes
    const text = new TextDecoder().decode(arrayBuffer);
    const textMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches && textMatches.length > 0) {
      const extracted = textMatches.map(m => m.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1')).join(' ');
      return extracted.substring(0, 20000);
    }
    // Fallback: strip all XML tags
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 20000);
  }
  
  // .doc (old binary format) – basic text extraction
  const text = new TextDecoder().decode(arrayBuffer);
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 20000);
}

async function parseResume(text) {
  const info = {
    name: extractField(text, /(?:姓名|Name)[\s:]*([\u4e00-\u9fa5]{2,8}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i) ||
         extractField(text, /([\u4e00-\u9fa5]{2,4})(?=\s*[，,]\s*(?:男|女|电话|手机|邮箱|Email|性别))/),
    phone: extractField(text, /(?:电话|手机|Phone|Tel|联系方式)[\s:]*([\+\d\-\s]{8,})/i) ||
          extractField(text, /(\+?[\d]{1,4}[-.\s]?[\d]{1,4}[-.\s]?[\d]{4,})/),
    email: extractField(text, /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/),
    education: extractSection(text, /(?:教育|学历|Education)[\s背景]*[\n:：]/i),
    experience: extractSection(text, /(?:工作|实习|经验|Experience|Work)[\s经历]*[\n:：]/i),
    skills: extractSection(text, /(?:技能|Skills|Skill)[\s:：]/i),
    projects: extractSection(text, /(?:项目|Projects)[\s经验]*[\n:：]/i),
    gender: extractField(text, /(?:性别|Gender)[\s:]*([\u4e00-\u9fa5]{1,2}|Male|Female)/i),
    birthday: extractField(text, /(?:出生日期|出生年月|生日|Birth)[\s:]*([\d]{4}[\-/年][\d]{1,2}[\-/月][\d]{0,2})/i),
    address: extractField(text, /(?:地址|Address|居住地|现居)[\s:]*([\u4e00-\u9fa5]{3,30})/i),
    city: extractField(text, /(?:城市|City|所在城市)[\s:]*([\u4e00-\u9fa5]{2,10})/i)
  };
  return info;
}

function extractField(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractSection(text, regex) {
  const match = text.match(regex);
  if (!match) return '';
  const start = match.index;
  let end = text.indexOf('\n\n', start + 50);
  if (end === -1) end = text.indexOf('---', start + 50);
  if (end === -1) end = text.indexOf('==', start + 50);
  if (end === -1) end = start + 800;
  const section = text.substring(start, end > start ? end : start + 500);
  return section.replace(/[\n\r]+/g, ' ').trim().substring(0, 300);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ====== Storage Functions ======

async function loadResume() {
  const result = await chrome.storage.local.get('resume');
  if (result.resume) {
    currentResume = result.resume;
    updateUI();
  }
}

async function deleteResume() {
  await chrome.storage.local.remove('resume');
  currentResume = null;
  updateUI();
  showStatus('简历已删除', 'info');
}

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  if (result.settings) {
    aiProvider.value = result.settings.provider || 'openai';
    apiKey.value = result.settings.apiKey || '';
    customEndpoint.value = result.settings.customEndpoint || '';
    modelSelect.value = result.settings.model || 'gpt-4o';
    updateModelOptions();
  }
}

async function saveSettings() {
  const settings = {
    provider: aiProvider.value,
    apiKey: apiKey.value,
    customEndpoint: customEndpoint.value,
    model: modelSelect.value
  };
  await chrome.storage.local.set({ settings });
  showStatus('设置已保存', 'success');
  settingsPanel.classList.add('hidden');
  isSettingsOpen = false;
}

function updateModelOptions() {
  const provider = aiProvider.value;
  customEndpointGroup.style.display = provider === 'custom' ? 'block' : 'none';
  
  modelSelect.innerHTML = '';
  if (provider === 'openai') {
    modelSelect.innerHTML = `
      <option value="gpt-4o">GPT-4o</option>
      <option value="gpt-4o-mini">GPT-4o Mini</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
    `;
  } else if (provider === 'moonshot') {
    modelSelect.innerHTML = `
      <option value="moonshot-v1-8k">Moonshot v1-8k</option>
      <option value="moonshot-v1-32k">Moonshot v1-32k</option>
      <option value="moonshot-v1-128k">Moonshot v1-128k</option>
    `;
  } else {
    modelSelect.innerHTML = `<option value="custom">自定义模型</option>`;
  }
}

function toggleSettings() {
  isSettingsOpen = !isSettingsOpen;
  settingsPanel.classList.toggle('hidden', !isSettingsOpen);
}

// ====== UI Updates ======

function updateUI() {
  if (currentResume) {
    uploadSection.classList.add('hidden');
    resumeSection.classList.remove('hidden');
    resumeName.textContent = currentResume.name;
    resumeSize.textContent = currentResume.size;
    scanBtn.disabled = false;

    // Render parsed info
    const info = currentResume.parsed || {};
    parsedInfo.innerHTML = `
      <div class="info-grid">
        ${info.name ? `<span class="info-label">姓名</span><span class="info-value">${escapeHtml(info.name)}</span>` : ''}
        ${info.phone ? `<span class="info-label">电话</span><span class="info-value">${escapeHtml(info.phone)}</span>` : ''}
        ${info.email ? `<span class="info-label">邮箱</span><span class="info-value">${escapeHtml(info.email)}</span>` : ''}
      </div>
      ${info.education ? `<div class="info-section"><div class="info-section-title">教育背景</div><div class="info-section-content">${escapeHtml(info.education)}</div></div>` : ''}
      ${info.experience ? `<div class="info-section"><div class="info-section-title">工作经验</div><div class="info-section-content">${escapeHtml(info.experience)}</div></div>` : ''}
      ${info.skills ? `<div class="info-section"><div class="info-section-title">技能</div><div class="info-section-content">${escapeHtml(info.skills)}</div></div>` : ''}
      ${info.projects ? `<div class="info-section"><div class="info-section-title">项目经验</div><div class="info-section-content">${escapeHtml(info.projects)}</div></div>` : ''}
    `;
  } else {
    uploadSection.classList.remove('hidden');
    resumeSection.classList.add('hidden');
    scanBtn.disabled = true;
  }
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 4000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ====== Scan and Fill ======

async function startScanAndFill() {
  if (!currentResume) {
    showStatus('请先上传简历', 'error');
    return;
  }

  const settings = await chrome.storage.local.get('settings');
  if (!settings.settings || !settings.settings.apiKey) {
    showStatus('请先设置 API Key', 'error');
    toggleSettings();
    return;
  }

  // Show progress
  progressSection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  progressFill.style.width = '10%';
  progressText.textContent = '正在扫描页面表单...';

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('无法获取当前页面');
    }

    console.log('[AI Resume] Starting scan and fill on tab:', tab.url);

    // Step 1: Scan form fields
    progressFill.style.width = '30%';
    progressText.textContent = '正在扫描页面表单...';
    
    const scanResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanFormFields
    });

    const formFields = scanResult[0].result;
    console.log('[AI Resume] Scanned fields:', formFields.length, formFields);
    
    if (!formFields || formFields.length === 0) {
      showStatus('当前页面未检测到表单字段', 'error');
      progressSection.classList.add('hidden');
      return;
    }

    progressFill.style.width = '50%';
    progressText.textContent = `发现 ${formFields.length} 个字段，AI 正在匹配...`;

    // Step 2: Send to background for AI matching
    console.log('[AI Resume] Resume text length:', currentResume.text?.length);
    console.log('[AI Resume] Resume parsed:', JSON.stringify(currentResume.parsed));
    
    const matchResult = await chrome.runtime.sendMessage({
      action: 'matchFields',
      resumeText: currentResume.text,
      resumeParsed: currentResume.parsed,
      formFields: formFields,
      settings: settings.settings
    });

    console.log('[AI Resume] Match result:', JSON.stringify(matchResult));
    
    if (!matchResult || !matchResult.success) {
      throw new Error(matchResult?.error || 'AI 匹配失败');
    }

    // Diagnostic: if no matched fields, show why
    if (!matchResult.matchedFields || matchResult.matchedFields.length === 0) {
      console.warn('[AI Resume] No matched fields! Total fields:', formFields.length);
      console.warn('[AI Resume] Resume text length:', currentResume.text?.length || 0);
      console.warn('[AI Resume] Resume parsed:', JSON.stringify(currentResume.parsed));
      
      // Show diagnostic message
      if (!currentResume.text || currentResume.text.trim().length < 50) {
        showStatus('简历文本提取为空，请重新上传或转换为 TXT 格式', 'error');
      } else {
        showStatus('未能匹配任何字段。表单字段可能没有标准属性，建议使用「手动补充填写」', 'error');
      }
      
      // Still show the field list for reference
      progressSection.classList.add('hidden');
      return;
    }

    progressFill.style.width = '80%';
    progressText.textContent = '正在填充表单...';

    // Step 3: Fill the form
    console.log('[AI Resume] Matched fields to fill:', matchResult.matchedFields.length, JSON.stringify(matchResult.matchedFields));
    
    const fillResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillFormFields,
      args: [matchResult.matchedFields]
    });

    progressFill.style.width = '100%';
    progressText.textContent = '填充完成！';

    // Show results
    const result = fillResult[0].result;
    console.log('[AI Resume] Fill result:', JSON.stringify(result));
    showResults(result, matchResult.unmatchedFields || []);
    showStatus(`成功填充 ${result.filled} 个字段！`, 'success');

  } catch (error) {
    console.error('Fill error:', error);
    showStatus('填充失败：' + error.message, 'error');
  } finally {
    setTimeout(() => {
      progressSection.classList.add('hidden');
    }, 1000);
  }
}

function showResults(result, unmatched) {
  resultSection.classList.remove('hidden');
  totalFields.textContent = result.total;
  filledFields.textContent = result.filled;
  unmatchedFields.textContent = unmatched.length;

  if (unmatched.length > 0) {
    unmatchedList.innerHTML = unmatched.map(f => `
      <div class="unmatched-item">
        <span class="unmatched-name">${escapeHtml(f.label || f.name || f.placeholder || '未知字段')}</span>
        <span class="unmatched-tag">${escapeHtml(f.type || 'text')}</span>
      </div>
    `).join('');
    unmatchedList.classList.remove('collapsed');
  } else {
    unmatchedList.classList.add('collapsed');
  }
}

function openManualFill() {
  chrome.runtime.sendMessage({ action: 'openManualFill' });
}

// ====== Injected Functions (run in page context) ======

function scanFormFields() {
  const fields = [];
  const inputs = document.querySelectorAll('input, textarea, select');
  
  // Helper to build a CSS selector path for reliable re-targeting
  function getCssPath(element) {
    const path = [];
    let node = element;
    while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.body) {
      let selector = node.nodeName.toLowerCase();
      if (node.id) {
        selector += '#' + node.id;
        path.unshift(selector);
        break;
      }
      let sibling = node;
      let siblingIndex = 1;
      while (sibling = sibling.previousElementSibling) {
        if (sibling.nodeName.toLowerCase() === selector) siblingIndex++;
      }
      if (node.parentNode && node.parentNode.children.length > 1 && siblingIndex > 1) {
        selector += `:nth-of-type(${siblingIndex})`;
      }
      path.unshift(selector);
      node = node.parentNode;
    }
    return path.join(' > ');
  }
  
  inputs.forEach((input, index) => {
    const type = input.type || input.tagName.toLowerCase();
    if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset') return;
    if (input.disabled || input.readOnly) return;

    // Find label - comprehensive detection strategy
    let label = '';
    const id = input.id;
    const name = input.name;
    const placeholder = input.placeholder;
    const ariaLabel = input.getAttribute('aria-label');
    const dataField = input.getAttribute('data-field') || input.getAttribute('data-name') || input.getAttribute('data-label');
    
    // 1. Standard label[for]
    if (id) {
      const labelEl = document.querySelector(`label[for="${id}"]`);
      if (labelEl) label = labelEl.textContent.trim();
    }
    // 2. Parent label
    if (!label) {
      const parentLabel = input.closest('label');
      if (parentLabel) {
        const text = parentLabel.textContent.trim();
        label = text.replace(input.value, '').trim();
      }
    }
    // 3. Previous sibling label
    if (!label) {
      const prevLabel = input.previousElementSibling;
      if (prevLabel && prevLabel.tagName === 'LABEL') {
        label = prevLabel.textContent.trim();
      }
    }
    // 4. Previous sibling div/span (common in Chinese forms)
    if (!label) {
      let sibling = input.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === 'DIV' || sibling.tagName === 'SPAN' || sibling.tagName === 'P') {
          const text = sibling.textContent.trim();
          if (text.length > 0 && text.length < 100) {
            label = text;
            break;
          }
        }
        sibling = sibling.previousElementSibling;
      }
    }
    // 5. Parent's first child text (e.g., <div class="form-item"><div>Label</div><input></div>)
    if (!label) {
      const parent = input.parentElement;
      if (parent) {
        const firstChild = parent.firstElementChild;
        if (firstChild && firstChild !== input) {
          const text = firstChild.textContent.trim();
          if (text.length > 0 && text.length < 100 && !firstChild.querySelector('input')) {
            label = text;
          }
        }
      }
    }
    // 6. Grandparent's label-like div
    if (!label) {
      const grandparent = input.closest('div[class*="label"], div[class*="field"], div[class*="item"], div[class*="form"]');
      if (grandparent) {
        const labelDiv = grandparent.querySelector('div:first-child, span:first-child');
        if (labelDiv) {
          const text = labelDiv.textContent.trim();
          if (text.length > 0 && text.length < 100) {
            label = text;
          }
        }
      }
    }
    // 7. Use data-* attribute as fallback
    if (!label && dataField) {
      label = dataField;
    }

    // Get surrounding text for context
    let context = '';
    const parent = input.closest('div, td, fieldset, tr');
    if (parent) {
      const text = parent.textContent.trim();
      if (text.length > 5 && text.length < 200) {
        context = text;
      }
    }
    // Also check grandparent context
    if (!context) {
      const grandparent = input.closest('div')?.parentElement;
      if (grandparent) {
        const text = grandparent.textContent.trim();
        if (text.length > 5 && text.length < 200) {
          context = text;
        }
      }
    }

    fields.push({
      index: index,
      tagName: input.tagName.toLowerCase(),
      type: type,
      name: name || '',
      id: id || '',
      placeholder: placeholder || '',
      label: label || '',
      ariaLabel: ariaLabel || '',
      dataField: dataField || '',
      context: context,
      required: input.required || false,
      cssPath: getCssPath(input),
      options: input.tagName.toLowerCase() === 'select' 
        ? Array.from(input.options).map(o => ({ value: o.value, text: o.text }))
        : null
    });
  });

  return fields;
}

function fillFormFields(matchedFields) {
  const result = { total: matchedFields.length, filled: 0, failed: 0 };
  
  console.log('[AI Resume Fill] Received matchedFields count:', matchedFields.length, 'Details:', JSON.stringify(matchedFields.map(m => ({ label: m.field.label, name: m.field.name, id: m.field.id, value: m.value }))));

  matchedFields.forEach(item => {
    const { field, value } = item;
    
    try {
      let target = null;
      
      // 1. Try by id (most reliable)
      if (field.id && field.id.trim()) {
        target = document.getElementById(field.id.trim());
        if (target) console.log('[AI Resume Fill] Found by id:', field.id);
      }
      
      // 2. Try by name (use CSS.escape for safety)
      if (!target && field.name && field.name.trim()) {
        try {
          const targets = document.querySelectorAll(`[name="${CSS.escape(field.name.trim())}"]`);
          if (targets.length === 1) { target = targets[0]; }
          else if (targets.length > 1) {
            for (const t of targets) {
              if (t.offsetParent !== null) { target = t; break; }
            }
          }
          if (target) console.log('[AI Resume Fill] Found by name:', field.name);
        } catch (e) {}
      }
      
      // 3. Try by CSS path (generated during scan)
      if (!target && field.cssPath) {
        try {
          target = document.querySelector(field.cssPath);
          if (target) console.log('[AI Resume Fill] Found by cssPath');
        } catch (e) {}
      }
      
      // 4. Try by label association
      if (!target && field.label) {
        const labels = document.querySelectorAll('label');
        for (const label of labels) {
          if (label.textContent.trim().includes(field.label)) {
            const forId = label.getAttribute('for');
            if (forId) {
              target = document.getElementById(forId);
            } else {
              target = label.querySelector('input, textarea, select');
            }
            if (target) { console.log('[AI Resume Fill] Found by label:', field.label); break; }
          }
        }
      }
      
      // 5. Try by placeholder
      if (!target && field.placeholder) {
        try {
          target = document.querySelector(`[placeholder="${CSS.escape(field.placeholder)}"]`);
          if (target) console.log('[AI Resume Fill] Found by placeholder:', field.placeholder);
        } catch (e) {}
      }
      
      // 6. Try by aria-label
      if (!target && field.ariaLabel) {
        try {
          target = document.querySelector(`[aria-label="${CSS.escape(field.ariaLabel)}"]`);
          if (target) console.log('[AI Resume Fill] Found by aria-label:', field.ariaLabel);
        } catch (e) {}
      }
      
      // 7. Final fallback: re-scan and match by attributes
      if (!target) {
        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select');
        for (const input of inputs) {
          if (input.id && input.id === field.id) { target = input; break; }
          if (input.name && input.name === field.name) { target = input; break; }
          if (field.placeholder && input.placeholder && input.placeholder.includes(field.placeholder)) { target = input; break; }
          if (field.ariaLabel && input.getAttribute('aria-label') === field.ariaLabel) { target = input; break; }
        }
        if (target) console.log('[AI Resume Fill] Found by fallback scan');
      }

      if (!target) {
        console.log('[AI Resume Fill] Could not find target for field:', JSON.stringify(field));
        result.failed++;
        return;
      }

      console.log('[AI Resume Fill] Filling', field.label || field.name || field.id, 'with value:', value.substring(0, 50));

      // Fill based on type
      const tagName = target.tagName.toLowerCase();
      const type = target.type || tagName;

      if (tagName === 'select') {
        let matched = false;
        for (const opt of target.options) {
          if (opt.text.toLowerCase().includes(value.toLowerCase()) || 
              opt.value.toLowerCase() === value.toLowerCase()) {
            target.value = opt.value;
            matched = true;
            break;
          }
        }
        if (!matched) {
          for (const opt of target.options) {
            if (value.toLowerCase().includes(opt.text.toLowerCase()) || 
                opt.text.toLowerCase().includes(value.toLowerCase())) {
              target.value = opt.value;
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          result.failed++;
          return;
        }
      } else if (type === 'checkbox') {
        target.checked = value === 'true' || value === true || value === 'on' || value === 'yes' || value === '1';
      } else if (type === 'radio') {
        try {
          const radios = document.querySelectorAll(`[name="${CSS.escape(target.name)}"]`);
          radios.forEach(r => {
            if (r.value.toLowerCase() === value.toLowerCase()) {
              r.checked = true;
            }
          });
        } catch (e) {}
      } else if (type === 'file') {
        result.failed++;
        return;
      } else if (type === 'date') {
        const dateMatch = value.match(/(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
        if (dateMatch) {
          target.value = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
        } else {
          target.value = value;
        }
      } else {
        target.value = value;
      }

      // Trigger events to ensure React/Vue/Angular frameworks detect changes
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.dispatchEvent(new Event('blur', { bubbles: true }));
      
      // Highlight the field briefly
      const originalBg = target.style.backgroundColor;
      target.style.backgroundColor = '#e6f7ed';
      target.style.transition = 'background-color 0.3s';
      setTimeout(() => {
        target.style.backgroundColor = originalBg;
      }, 1500);

      result.filled++;
    } catch (e) {
      console.error('Fill error for field:', field, e);
      result.failed++;
    }
  });

  console.log('[AI Resume Fill] Final result:', JSON.stringify(result));
  return result;
}
