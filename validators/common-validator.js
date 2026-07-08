const { z } = require('zod');
const { parseOrThrow, validationError } = require('./zod-utils');

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUuid(value, field = 'ID') {
  return parseOrThrow(
    z.string({
      invalid_type_error: `${field} tidak valid.`,
      required_error: `${field} tidak valid.`
    }).regex(UUID_PATTERN, `${field} tidak valid.`),
    value
  );
}

function validateLimit(value, fallback = 20) {
  if (value === null || value === undefined || value === '') return fallback;

  if (!/^\d+$/.test(String(value))) {
    throw validationError('Limit tidak valid.');
  }

  const limit = parseOrThrow(
    z.coerce.number({
      invalid_type_error: 'Limit tidak valid.'
    })
      .int('Limit tidak valid.')
      .min(1, 'Limit harus berada di antara 1 dan 50.')
      .max(50, 'Limit harus berada di antara 1 dan 50.'),
    value
  );

  return limit;
}

function validateOffset(value) {
  if (value === null || value === undefined || value === '') return 0;

  if (!/^\d+$/.test(String(value))) {
    throw validationError('Offset tidak valid.');
  }

  return parseOrThrow(
    z.coerce.number()
      .int('Offset tidak valid.')
      .min(0, 'Offset tidak valid.')
      .max(100_000, 'Offset terlalu besar.'),
    value
  );
}

module.exports = {
  validateLimit,
  validateOffset,
  validateUuid
};
