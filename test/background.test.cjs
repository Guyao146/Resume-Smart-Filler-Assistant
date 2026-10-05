const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function background() {
  const context = vm.createContext({
    console,
    chrome: { runtime: { onMessage: { addListener() {} } } },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../background/background.js'), 'utf8'), context);
  return context;
}

test('background loads and builds one complete matching prompt', () => {
  const app = background();
  const prompt = app.buildMatchingPrompt('sample resume', { name: 'Test' }, [
    { index: 7, label: 'Name', type: 'text' },
  ]);
  assert.ok(prompt.includes('sample resume'));
  assert.ok(prompt.includes('"index": 7'));
  assert.equal(prompt.match(/"index": 0/g).length, 1);
  assert.ok(prompt.trimEnd().endsWith(']'));
});

test('background accepts fenced JSON without changing field values', () => {
  const app = background();
  const result = app.parseAIResponse('```json\n[{"index":7,"value":"Test"}]\n```', []);
  assert.equal(result[0].index, 7);
  assert.equal(result[0].value, 'Test');
});