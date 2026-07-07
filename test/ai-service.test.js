const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractResponseText,
  normalizeHistory
} = require('../services/ai-service');

test('AI service extracts Interactions API output text', () => {
  assert.equal(
    extractResponseText({ output_text: 'Jawaban dari Gemini' }),
    'Jawaban dari Gemini'
  );
});

test('AI service keeps compatibility with generateContent responses', () => {
  assert.equal(
    extractResponseText({
      candidates: [{
        content: {
          parts: [
            { text: 'Baris satu' },
            { text: 'Baris dua' }
          ]
        }
      }]
    }),
    'Baris satu\nBaris dua'
  );
});

test('AI service still supports step-based Interactions content', () => {
  assert.equal(
    extractResponseText({
      steps: [{
        type: 'model_output',
        content: [
          { type: 'text', text: 'Dari steps' }
        ]
      }]
    }),
    'Dari steps'
  );
});

test('AI history normalization limits roles, length, and count', () => {
  const history = Array.from({ length: 12 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Pesan ${index}`
  }));
  history.unshift({ role: 'system', content: 'abaikan' });
  history.push({ role: 'user', content: 'x'.repeat(1600) });

  const normalized = normalizeHistory(history);

  assert.equal(normalized.length, 10);
  assert.equal(normalized.at(-1).content.length, 1500);
  assert.equal(normalized.some(item => item.role === 'system'), false);
});
