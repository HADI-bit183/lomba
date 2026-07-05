const { AppError } = require('../database/errors');

function validateAiChatInput(input) {
  const message = typeof input?.message === 'string' ? input.message.trim() : '';
  if (!message || message.length > 1500) {
    throw new AppError(
      'Pertanyaan harus berisi 1–1500 karakter.',
      400,
      'VALIDATION_ERROR'
    );
  }
  return { history: input.history, message };
}

function isDirectChatCreate(input) {
  return Object.hasOwn(input || {}, 'prompt') || Object.hasOwn(input || {}, 'response');
}

module.exports = {
  isDirectChatCreate,
  validateAiChatInput
};
