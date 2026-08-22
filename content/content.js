/**
 * AI Resume Autofill - Content Script
 * Injected into web pages to assist with form operations
 */

// Safe wrapper for chrome.runtime.sendMessage that catches invalidated context
function safeSendMessage(message) {
  try {
    if (!chrome.runtime || !chrome.runtime.id) {
      // Extension context is invalidated, disconnect observer
      if (formObserver) {
        formObserver.disconnect();
      }
      return Promise.reject(new Error('Extension context invalidated'));
    }
    return chrome.runtime.sendMessage(message);
  } catch (e) {
    // Context invalidated, disconnect to avoid repeated errors
    if (formObserver) {
      formObserver.disconnect();
    }
    return Promise.reject(e);
  }
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ ready: true });
    return true;
  }
  
  if (request.action === 'highlightFields') {
    highlightEmptyFields();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'getPageInfo') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      hasForm: document.querySelector('form, input, textarea') !== null
    });
    return true;
  }
});

// Auto-detect when page has a form and notify extension
function detectForm() {
  const inputs = document.querySelectorAll('input, textarea, select');
  const visibleInputs = Array.from(inputs).filter(input => {
    const type = input.type || input.tagName.toLowerCase();
    return type !== 'hidden' && type !== 'submit' && type !== 'button' && !input.disabled;
  });
  
  if (visibleInputs.length > 0) {
    safeSendMessage({
      action: 'formDetected',
      url: window.location.href,
      fieldCount: visibleInputs.length
    }).catch(() => {}); // Silently ignore errors
  }
}

// Highlight empty form fields
function highlightEmptyFields() {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    const type = input.type || input.tagName.toLowerCase();
    if (type === 'hidden' || type === 'submit' || type === 'button') return;
    if (!input.value || input.value === '') {
      input.style.borderColor = '#1677ff';
      input.style.boxShadow = '0 0 0 2px rgba(22,119,255,0.2)';
      setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
      }, 3000);
    }
  });
}

// Initialize
let formObserver = null;

detectForm();

// Observe DOM changes for dynamically loaded forms
formObserver = new MutationObserver(() => {
  detectForm();
});
formObserver.observe(document.body, { childList: true, subtree: true });

// Add keyboard shortcut: Ctrl+Shift+R to open manual fill panel
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    safeSendMessage({ action: 'openManualFill' }).catch(() => {});
  }
});

console.log('[AI Resume Autofill] Content script loaded on', window.location.href);
