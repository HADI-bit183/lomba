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
  return (apiResponse.steps || [])
    .filter(step => step.type === 'model_output')
    .flatMap(step => step.content || [])
    .filter(content => content.type === 'text')
    .map(content => content.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function generateAnswer(message, history) {
  if (!env.geminiApiKey) {
    return 'Layanan AI saat ini sedang dalam pemeliharaan atau belum dikonfigurasi. Mohon maaf atas ketidaknyamanan ini dan silakan coba beberapa saat lagi.';
  }

  const transcript = normalizeHistory(history)
    .map(item => `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${item.content}`)
    .join('\n');
  const input = transcript
    ? `${transcript}\nUser: ${message}`
    : message;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const apiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': env.geminiApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.geminiModel,
          system_instruction: [
            'You are NovaMind AI, a helpful bilingual assistant for an Indonesian student innovation competition.',
            'Answer in the same language as the user, using concise and natural wording.',
            'Use plain text only. Do not use Markdown markers such as asterisks, hashes, backticks, or underscore emphasis.',
            'For lists, use short lines beginning with a hyphen.',
            'Prioritize factual accuracy. If a fact is uncertain, say so clearly instead of guessing.',
            'Known NovaMind context: registration is for university student teams; the submission deadline is 17 October 2026; the grand final is 28 November 2026.',
            'Never claim that this static competition demo has processed payments, verified documents, or performed real administrative actions.'
          ].join(' '),
          input,
          store: false,
          generation_config: {
            max_output_tokens: 600
          }
        }),
        signal: controller.signal
      }
    );

    const data = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      const errorStatus = data?.error?.status || 'unknown';
      console.error('Gemini request failed:', apiResponse.status, errorStatus);

      if (apiResponse.status === 429 && errorStatus === 'RESOURCE_EXHAUSTED') {
        throw new AppError(
          'Kuota Gemini API telah habis. Periksa kuota atau billing Google AI.',
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
      if (apiResponse.status === 400 || apiResponse.status === 401 || apiResponse.status === 403) {
        throw new AppError(
          'Gemini API key atau konfigurasi model tidak valid.',
          502,
          'AI_AUTH_ERROR'
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
  extractResponseText,
  generateAnswer,
  normalizeHistory
};
