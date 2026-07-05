const { AppError } = require('../database/errors');

function createChatHistoryModel({ prompt, response, userId, visitorId }) {
  const normalizedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  const normalizedResponse = typeof response === 'string' ? response.trim() : '';

  if (
    !normalizedPrompt ||
    normalizedPrompt.length > 1500 ||
    !normalizedResponse ||
    normalizedResponse.length > 20_000
  ) {
    throw new AppError('Riwayat chat tidak valid.', 400, 'VALIDATION_ERROR');
  }

  return {
    prompt: normalizedPrompt,
    response: normalizedResponse,
    user_id: userId || null,
    visitor_id: visitorId
  };
}

function toPublicChat(record) {
  return {
    id: record.id,
    prompt: record.prompt,
    response: record.response,
    createdAt: record.created_at
  };
}

module.exports = {
  createChatHistoryModel,
  toPublicChat
};
