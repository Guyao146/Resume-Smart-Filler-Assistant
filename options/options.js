/**
 * AI Resume Autofill - Options Page Script
 */

const optProvider = document.getElementById('optProvider');
const optApiKey = document.getElementById('optApiKey');
const optCustomEndpointGroup = document.getElementById('optCustomEndpointGroup');
const optCustomEndpoint = document.getElementById('optCustomEndpoint');
const optModel = document.getElementById('optModel');
const optAutoFill = document.getElementById('optAutoFill');
const optHighlight = document.getElementById('optHighlight');
const optConfirm = document.getElementById('optConfirm');
const resumeInfo = document.getElementById('resumeInfo');
const deleteResumeBtn = document.getElementById('deleteResumeBtn');
const exportResumeBtn = document.getElementById('exportResumeBtn');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');
const statTotalFills = document.getElementById('statTotalFills');
const statTotalFields = document.getElementById('statTotalFields');
const statSuccessRate = document.getElementById('statSuccessRate');

// Initialize
(async () => {
  await loadSettings();
  await loadResumeInfo();
  await loadStats();
  setupEventListeners();
})();

function setupEventListeners() {
  optProvider.addEventListener('change', updateUI);
  saveBtn.addEventListener('click', saveSettings);
  deleteResumeBtn.addEventListener('click', deleteResume);
  exportResumeBtn.addEventListener('click', exportResume);
}

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  if (result.settings) {
    optProvider.value = result.settings.provider || 'openai';
    optApiKey.value = result.settings.apiKey || '';
    optCustomEndpoint.value = result.settings.customEndpoint || '';
    optModel.value = result.settings.model || 'gpt-4o';
    optAutoFill.checked = result.settings.autoFill !== false;
    optHighlight.checked = result.settings.highlight !== false;
    optConfirm.checked = result.settings.confirm === true;
    updateUI();
  }
}

async function loadResumeInfo() {
  const result = await chrome.storage.local.get('resume');
  if (result.resume) {
    const r = result.resume;
    resumeInfo.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${escapeHtml(r.name)}</strong>
          <span style="color:#999;font-size:12px;margin-left:8px;">${r.size}</span>
        </div>
        <span style="color:#1a7f37;font-size:12px;">✓ 已加载</span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:#666;">
        上传时间: ${new Date(r.timestamp).toLocaleString()}
      </div>
    `;
  } else {
    resumeInfo.innerHTML = '<p class="empty">暂无简历，请在插件弹窗中上传</p>';
  }
}

async function loadStats() {
  const result = await chrome.storage.local.get('stats');
  const stats = result.stats || { totalFills: 0, totalFields: 0, successFields: 0 };
  statTotalFills.textContent = stats.totalFills || 0;
  statTotalFields.textContent = stats.totalFields || 0;
  const rate = stats.totalFields > 0 ? Math.round((stats.successFields / stats.totalFields) * 100) : 0;
  statSuccessRate.textContent = rate + '%';
}

function updateUI() {
  const provider = optProvider.value;
  optCustomEndpointGroup.style.display = provider === 'custom' ? 'block' : 'none';
  
  // Update model options
  const current = optModel.value;
  optModel.innerHTML = '';
  if (provider === 'openai') {
    optModel.innerHTML = `
      <option value="gpt-4o">GPT-4o</option>
      <option value="gpt-4o-mini">GPT-4o Mini</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
    `;
  } else if (provider === 'moonshot') {
    optModel.innerHTML = `
      <option value="moonshot-v1-8k">Moonshot v1-8k</option>
      <option value="moonshot-v1-32k">Moonshot v1-32k</option>
      <option value="moonshot-v1-128k">Moonshot v1-128k</option>
    `;
  } else {
    optModel.innerHTML = `<option value="custom">自定义模型</option>`;
  }
  // Try to restore selection
  if (Array.from(optModel.options).some(o => o.value === current)) {
    optModel.value = current;
  }
}

async function saveSettings() {
  const settings = {
    provider: optProvider.value,
    apiKey: optApiKey.value,
    customEndpoint: optCustomEndpoint.value,
    model: optModel.value,
    autoFill: optAutoFill.checked,
    highlight: optHighlight.checked,
    confirm: optConfirm.checked
  };
  
  await chrome.storage.local.set({ settings });
  saveStatus.textContent = '✓ 设置已保存';
  saveStatus.className = 'save-status';
  setTimeout(() => saveStatus.textContent = '', 3000);
}

async function deleteResume() {
  if (!confirm('确定要删除已上传的简历吗？')) return;
  await chrome.storage.local.remove('resume');
  await loadResumeInfo();
  saveStatus.textContent = '✓ 简历已删除';
  setTimeout(() => saveStatus.textContent = '', 3000);
}

async function exportResume() {
  const result = await chrome.storage.local.get('resume');
  if (!result.resume) {
    saveStatus.textContent = '没有可导出的简历';
    saveStatus.className = 'save-status error';
    return;
  }
  
  const dataStr = JSON.stringify(result.resume, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume-data.json';
  a.click();
  URL.revokeObjectURL(url);
  
  saveStatus.textContent = '✓ 导出成功';
  saveStatus.className = 'save-status';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
