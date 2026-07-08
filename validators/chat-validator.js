const { z } = require('zod');
const { parseOrThrow } = require('./zod-utils');

const aiChatSchema = z.object({
  history: z.unknown().optional(),
  message: z.preprocess(
    value => typeof value === 'string' ? value.trim() : value,
    z.string({
      invalid_type_error: 'Pertanyaan harus berisi 1-1500 karakter.',
      required_error: 'Pertanyaan harus berisi 1-1500 karakter.'
    })
      .min(1, 'Pertanyaan harus berisi 1-1500 karakter.')
      .max(1500, 'Pertanyaan harus berisi 1-1500 karakter.')
  )
});

function validateAiChatInput(input) {
  return parseOrThrow(aiChatSchema, input);
}

function isDirectChatCreate(input) {
  return Object.hasOwn(input || {}, 'prompt') || Object.hasOwn(input || {}, 'response');
}

module.exports = {
  isDirectChatCreate,
  validateAiChatInput
};
