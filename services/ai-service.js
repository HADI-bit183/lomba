const env = require('../config/env');
const { AppError } = require('../database/errors');

const MAX_HISTORY_ITEMS = 10;
const MAX_MESSAGE_LENGTH = 1500;
const REQUEST_TIMEOUT_MS = 45_000;

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_HISTORY_ITEMS)
    .filter(item => item && ['user', 'assistant'].includes(item.role))
    .map(item => ({
      role: item.role,
      content: String(item.content || '').slice(0, MAX_MESSAGE_LENGTH)
    }))
    .filter(item => item.content.trim());
}

function extractResponseText(apiResponse) {
  return (apiResponse.output || [])
    .filter(item => item.type === 'message')
    .flatMap(item => item.content || [])
    .filter(content => content.type === 'output_text')
    .map(content => content.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function generateAnswer(message, history) {
  if (!env.openAiApiKey) {
    return 'Layanan AI saat ini sedang dalam pemeliharaan atau belum dikonfigurasi. Mohon maaf atas ketidaknyamanan ini dan silakan coba beberapa saat lagi.';
  }

  const input = [...normalizeHistory(history), { role: 'user', content: message }];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.openAiModel,
        instructions: [
          'You are NovaMind AI, a helpful bilingual assistant for an Indonesian student innovation competition.',
          'Answer in the same language as the user, using concise and natural wording.',
          'Prioritize factual accuracy. If a fact is uncertain, say so clearly instead of guessing.',
          'Use web search for current or location-based factual questions.',
          'Known NovaMind context: registration is for university student teams; the submission deadline is 17 October 2026; the grand final is 28 November 2026.',
          'Never claim that this static competition demo has processed payments, verified documents, or performed real administrative actions.'
        ].join(' '),
        input,
        tools: [{ type: 'web_search_preview' }],
        tool_choice: 'auto',
        max_output_tokens: 600
      }),
      signal: controller.signal
    });

    const data = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      console.error('OpenAI request failed:', apiResponse.status, data?.error?.code || 'unknown');
      if (data?.error?.code === 'insufficient_quota') {
        throw new AppError(
          'Kredit API OpenAI belum tersedia. Aktifkan billing atau tambahkan kredit terlebih dahulu.',
          502,
          'AI_QUOTA_EXHAUSTED'
        );
      }
      if (apiResponse.status === 429) {
        throw new AppError(
          'Layanan AI sedang sibuk. Tunggu sebentar lalu coba lagi.',
          429,
          'AI_RATE_LIMITED'
        );
      }
      throw new AppError(
        'Layanan AI belum dapat menjawab. Coba lagi nanti.',
        502,
        'AI_UPSTREAM_ERROR'
      );
    }

    const answer = extractResponseText(data);
    if (!answer) {
      throw new AppError('AI tidak menghasilkan jawaban teks.', 502, 'EMPTY_AI_RESPONSE');
    }
    return answer;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const timedOut = error.name === 'AbortError';
    throw new AppError(
      timedOut
        ? 'Jawaban AI terlalu lama. Silakan coba lagi.'
        : 'Tidak dapat terhubung ke layanan AI.',
      502,
      timedOut ? 'AI_TIMEOUT' : 'AI_CONNECTION_ERROR'
    );
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateAnswer,
  normalizeHistory
};
