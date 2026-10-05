/**
 * AI Resume Autofill - Background Service Worker
 * Handles AI API calls, field matching, and cross-context communication
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'matchFields') {
    handleMatchFields(request)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
  
  if (request.action === 'openManualFill') {
    openManualFillPanel();
    sendResponse({ success: true });
  }
});

// ====== AI Field Matching ======

async function handleMatchFields({ resumeText, resumeParsed, formFields, settings }) {
  try {
    console.log('[AI Resume Match] Starting field matching. Fields:', formFields.length);
    console.log('[AI Resume Match] Resume parsed:', JSON.stringify(resumeParsed));
    
    const matchedFields = [];
    const unmatchedFields = [];
    
    // First, try simple rule-based matching for common fields
    const simpleMatches = simpleMatchFields(resumeParsed, formFields, resumeText);
    
    // Get remaining unmatched fields
    const matchedIndices = new Set(simpleMatches.map(m => m.field.index));
    const remainingFields = formFields.filter(f => !matchedIndices.has(f.index));
    
    console.log('[AI Resume Match] Remaining fields for AI:', remainingFields.length);
    
    if (remainingFields.length > 0) {
      // Use AI for complex matching
      const aiMatches = await aiMatchFields(resumeText, resumeParsed, remainingFields, settings);
      matchedFields.push(...simpleMatches, ...aiMatches.matched);
      unmatchedFields.push(...aiMatches.unmatched);
      console.log('[AI Resume Match] AI matched:', aiMatches.matched.length, 'unmatched:', aiMatches.unmatched.length);
    } else {
      matchedFields.push(...simpleMatches);
    }
    
    console.log('[AI Resume Match] Total matched:', matchedFields.length, 'unmatched:', unmatchedFields.length);
    return { success: true, matchedFields, unmatchedFields };
  } catch (error) {
    console.error('Match error:', error);
    return { success: false, error: error.message };
  }
}

function simpleMatchFields(resumeParsed, formFields, resumeText = '') {
  const matches = [];
  const fieldMappings = {
    'name': ['name', '姓名', 'fullname', 'full-name', 'full_name', 'realname'],
    'email': ['email', '邮箱', 'e-mail', 'mail', '电子邮件'],
    'phone': ['phone', '电话', 'mobile', '手机', 'tel', 'telephone', '联系方式'],
    'education': ['education', '学历', '学位', 'school', '大学', '院校', '毕业院校'],
    'experience': ['experience', '经验', '工作经历', '工作年限', 'years', 'work'],
    'skills': ['skills', '技能', 'skill', '技术栈', 'technologies'],
    'projects': ['projects', '项目', 'project'],
    'address': ['address', '地址', '住址', '居住地', 'location'],
    'city': ['city', '城市'],
    'birthday': ['birthday', 'birth', '出生日期', '出生年月', 'dob', 'dateofbirth'],
    'gender': ['gender', '性别', 'sex'],
    'linkedin': ['linkedin', '领英'],
    'github': ['github', 'git'],
    'portfolio': ['portfolio', '个人网站', 'website', 'blog', '主页'],
    'salary': ['salary', '期望薪资', '薪资', '薪酬', 'expected', 'pay'],
    'position': ['position', '职位', '岗位', '应聘职位', 'job', 'title']
  };
  
  // Helper: if parsed field is empty, try to extract directly from raw text
  function extractFromText(text, key) {
    const patterns = {
      'name': /(?:姓名|Name)[\s:]*([\u4e00-\u9fa5]{2,8}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i,
      'phone': /(?:电话|手机|Phone|Tel|联系方式)[\s:]*([\+\d\-\s]{8,})/i,
      'email': /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
      'gender': /(?:性别|Gender)[\s:]*([\u4e00-\u9fa5]{1,2}|Male|Female)/i,
      'birthday': /(?:出生日期|出生年月|生日|Birth)[\s:]*([\d]{4}[\-/年][\d]{1,2}[\-/月][\d]{0,2})/i,
      'address': /(?:地址|Address|居住地|现居)[\s:]*([\u4e00-\u9fa5]{3,30})/i,
      'city': /(?:城市|City|所在城市)[\s:]*([\u4e00-\u9fa5]{2,10})/i
    };
    const pattern = patterns[key];
    if (!pattern) return '';
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  }
  
  formFields.forEach(field => {
    const fieldKey = (field.name || field.id || field.label || field.placeholder || field.dataField || '').toLowerCase();
    const fieldText = [field.name, field.id, field.label, field.placeholder, field.ariaLabel, field.dataField, field.context].join(' ').toLowerCase();
    
    for (const [resumeKey, keywords] of Object.entries(fieldMappings)) {
      const matched = keywords.some(k => fieldKey.includes(k) || fieldText.includes(k));
      if (matched) {
        let value = '';
        
        if (resumeKey === 'name' && resumeParsed.name) value = resumeParsed.name;
        else if (resumeKey === 'name') value = extractFromText(resumeText, 'name');
        else if (resumeKey === 'email' && resumeParsed.email) value = resumeParsed.email;
        else if (resumeKey === 'email') value = extractFromText(resumeText, 'email');
        else if (resumeKey === 'phone' && resumeParsed.phone) value = resumeParsed.phone;
        else if (resumeKey === 'phone') value = extractFromText(resumeText, 'phone');
        else if (resumeKey === 'education' && resumeParsed.education) value = resumeParsed.education;
        else if (resumeKey === 'experience' && resumeParsed.experience) value = resumeParsed.experience;
        else if (resumeKey === 'skills' && resumeParsed.skills) value = resumeParsed.skills;
        else if (resumeKey === 'projects' && resumeParsed.projects) value = resumeParsed.projects;
        else if (resumeKey === 'gender' && resumeParsed.gender) value = resumeParsed.gender;
        else if (resumeKey === 'gender') value = extractFromText(resumeText, 'gender');
        else if (resumeKey === 'birthday' && resumeParsed.birthday) value = resumeParsed.birthday;
        else if (resumeKey === 'birthday') value = extractFromText(resumeText, 'birthday');
        else if (resumeKey === 'address' && resumeParsed.address) value = resumeParsed.address;
        else if (resumeKey === 'address') value = extractFromText(resumeText, 'address');
        else if (resumeKey === 'city' && resumeParsed.city) value = resumeParsed.city;
        else if (resumeKey === 'city') value = extractFromText(resumeText, 'city');
        else if (resumeKey === 'linkedin' && resumeParsed.linkedin) value = resumeParsed.linkedin;
        else if (resumeKey === 'github' && resumeParsed.github) value = resumeParsed.github;
        else if (resumeKey === 'portfolio' && resumeParsed.portfolio) value = resumeParsed.portfolio;
        else if (resumeKey === 'salary' && resumeParsed.salary) value = resumeParsed.salary;
        else if (resumeKey === 'position' && resumeParsed.position) value = resumeParsed.position;
        
        if (value) {
          matches.push({ field, value });
          console.log('[AI Resume Match] Simple match:', field.label || field.name || field.id, '->', resumeKey, 'value:', value.substring(0, 50));
        } else {
          console.log('[AI Resume Match] Simple match keyword found but no value:', field.label || field.name || field.id, '->', resumeKey);
        }
        break;
      }
    }
  });
  
  console.log('[AI Resume Match] Simple matches:', matches.length, 'of', formFields.length, 'fields');
  return matches;
}

async function aiMatchFields(resumeText, resumeParsed, remainingFields, settings) {
  const matched = [];
  const unmatched = [];
  
  const prompt = buildMatchingPrompt(resumeText, resumeParsed, remainingFields);
  
  try {
    console.log('[AI Resume Match] Calling AI API...');
    const response = await callAIAPI(prompt, settings);
    console.log('[AI Resume Match] AI response preview:', response.substring(0, 300));
    const aiResult = parseAIResponse(response, remainingFields);
    console.log('[AI Resume Match] AI parsed result:', JSON.stringify(aiResult));
    
    aiResult.forEach(item => {
      if (item.value && item.value !== 'NOT_FOUND' && item.value !== 'N/A') {
        const field = remainingFields.find(f => f.index === item.index);
        if (field) {
          matched.push({ field, value: item.value });
          console.log('[AI Resume Match] AI matched:', field.label || field.name || field.id, '->', item.value.substring(0, 50));
        }
      } else {
        const field = remainingFields.find(f => f.index === item.index);
        if (field) {
          unmatched.push(field);
          console.log('[AI Resume Match] AI unmatched:', field.label || field.name || field.id);
        }
      }
    });
  } catch (error) {
    console.error('AI matching error:', error);
    // Fallback: all remaining fields go to unmatched
    unmatched.push(...remainingFields);
  }
  
  return { matched, unmatched };
}

function buildMatchingPrompt(resumeText, resumeParsed, fields) {
  const fieldsJson = JSON.stringify(fields.map(f => ({
    index: f.index,
    label: f.label,
    name: f.name,
    placeholder: f.placeholder,
    type: f.type,
    context: f.context
  })), null, 2);
  
  return `你是一个专业的简历信息提取和表单填充助手。你的任务是：从简历正文中找到最匹配每个表单字段的信息，并返回填充结果。

## 规则
1. 仔细阅读每个表单字段的 label、name、placeholder 和上下文，理解它想要什么信息
2. 从"简历正文"中直接搜索和提取对应信息，不依赖"简历关键信息"
3. 对于每个字段，返回简历中最准确的匹配值
4. 如果字段是 select/dropdown，返回选项中最匹配的文本（或选项值）
5. 如果字段是 date，返回 YYYY-MM-DD 格式
6. 如果字段是 checkbox，返回 "true" 或 "false"
7. 如果简历中确实没有相关信息，返回 "NOT_FOUND"
8. 返回格式必须是严格的 JSON 数组，不要添加 markdown 代码块标记

## 简历正文（请从这里直接提取信息）
${resumeText.substring(0, 6000)}

## 简历关键信息（参考，不依赖）
${JSON.stringify(resumeParsed, null, 2)}

## 需要填充的表单字段
${fieldsJson}

## 输出格式（必须是纯 JSON 数组）
[
  {"index": 0, "value": "具体值"},
  {"index": 1, "value": "NOT_FOUND"}
]`;
}

function parseAIResponse(response, fields) {
  try {
    // 1. Try to extract from markdown code block
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const cleaned = codeBlockMatch[1].trim().replace(/^json\s*/, '');
      return JSON.parse(cleaned);
    }
    
    // 2. Try to extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // 3. Fallback: try to parse the whole response
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse AI response:', e, 'Raw response:', response.substring(0, 500));
    return fields.map(f => ({ index: f.index, value: 'NOT_FOUND' }));
  }
}

async function callAIAPI(prompt, settings) {
  const { provider, apiKey, model, customEndpoint } = settings;
  
  if (!apiKey) {
    throw new Error('API Key 未设置');
  }
  
  let endpoint, body, headers;
  
  if (provider === 'openai') {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    body = JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts information from resumes and fills form fields accurately.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });
  } else if (provider === 'moonshot') {
    endpoint = 'https://api.moonshot.cn/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    body = JSON.stringify({
      model: model || 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: '你是一个智能表单填充助手，根据简历信息为表单字段提供准确值。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });
  } else if (provider === 'custom') {
    endpoint = customEndpoint || '';
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    body = JSON.stringify({
      model: model || 'custom',
      messages: [
        { role: 'system', content: 'You are a form-filling assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`API 请求失败: ${response.status} - ${error.error?.message || error.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ====== Manual Fill Panel ======

async function openManualFillPanel() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  
  // Inject manual fill UI into page
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: injectManualFillPanel
  });
}

function injectManualFillPanel() {
  // Remove existing panel
  const existing = document.getElementById('ai-resume-manual-fill');
  if (existing) {
    existing.remove();
    return;
  }
  
  // Create panel
  const panel = document.createElement('div');
  panel.id = 'ai-resume-manual-fill';
  panel.innerHTML = `
    <div id="ai-resume-panel-header">
      <span>📝 AI 简历手动填充</span>
      <button id="ai-resume-close">✕</button>
    </div>
    <div id="ai-resume-panel-content">
      <p style="color:#666;font-size:12px;margin-bottom:8px;">点击右侧字段名，从简历中粘贴对应内容</p>
      <div id="ai-resume-field-list"></div>
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    #ai-resume-manual-fill {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      max-height: 500px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      z-index: 9999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid #e0e0e0;
    }
    #ai-resume-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1677ff;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
    }
    #ai-resume-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      padding: 0 4px;
    }
    #ai-resume-panel-content {
      padding: 12px 16px;
      overflow-y: auto;
      max-height: 430px;
    }
    #ai-resume-panel-content::-webkit-scrollbar { width: 4px; }
    #ai-resume-panel-content::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
    .ai-resume-field-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
    }
    .ai-resume-field-label { color: #555; font-weight: 500; }
    .ai-resume-field-actions { display: flex; gap: 4px; }
    .ai-resume-field-actions button {
      padding: 4px 10px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }
    .ai-resume-btn-fill {
      background: #1677ff;
      color: #fff;
    }
    .ai-resume-btn-fill:hover { background: #4096ff; }
    .ai-resume-btn-focus {
      background: #f0f0f0;
      color: #555;
    }
    .ai-resume-btn-focus:hover { background: #e0e0e0; }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(panel);
  
  // Populate fields
  const inputs = document.querySelectorAll('input, textarea, select');
  const list = document.getElementById('ai-resume-field-list');
  const fields = [];
  
  inputs.forEach((input, i) => {
    const type = input.type || input.tagName.toLowerCase();
    if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset') return;
    if (input.disabled || input.readOnly) return;
    
    let label = input.closest('label')?.textContent?.replace(input.value, '').trim() || 
                input.placeholder || 
                input.getAttribute('aria-label') || 
                input.name || 
                input.id || 
                `字段 ${i+1}`;
    
    fields.push({ input, label, type });
  });
  
  list.innerHTML = fields.map((f, i) => `
    <div class="ai-resume-field-item">
      <span class="ai-resume-field-label">${f.label}</span>
      <div class="ai-resume-field-actions">
        <button class="ai-resume-btn-focus" data-index="${i}">定位</button>
        <button class="ai-resume-btn-fill" data-index="${i}">填充</button>
      </div>
    </div>
  `).join('');
  
  // Events
  document.getElementById('ai-resume-close').addEventListener('click', () => panel.remove());
  
  list.querySelectorAll('.ai-resume-btn-focus').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = fields[parseInt(btn.dataset.index)];
      if (field) {
        field.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field.input.style.outline = '2px solid #1677ff';
        setTimeout(() => field.input.style.outline = '', 2000);
      }
    });
  });
  
  list.querySelectorAll('.ai-resume-btn-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = fields[parseInt(btn.dataset.index)];
      if (field) {
        const value = prompt(`请输入 "${field.label}" 的值：`, field.input.value);
        if (value !== null) {
          field.input.value = value;
          field.input.dispatchEvent(new Event('input', { bubbles: true }));
          field.input.dispatchEvent(new Event('change', { bubbles: true }));
          field.input.style.backgroundColor = '#e6f7ed';
          setTimeout(() => field.input.style.backgroundColor = '', 1000);
        }
      }
    });
  });
}
