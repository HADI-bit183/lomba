const { AppError } = require('../database/errors');

function validationError(message) {
  return new AppError(message, 400, 'VALIDATION_ERROR');
}

function parseOrThrow(schema, input, fallbackMessage = 'Input tidak valid.') {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const firstIssue = result.error.issues[0];
  throw validationError(firstIssue?.message || fallbackMessage);
}

module.exports = {
  parseOrThrow,
  validationError
};
