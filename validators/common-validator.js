const { AppError } = require('../database/errors');

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUuid(value, field = 'ID') {
  if (!UUID_PATTERN.test(value || '')) {
    throw new AppError(`${field} tidak valid.`, 400, 'VALIDATION_ERROR');
  }
  return value;
}

function validateLimit(value, fallback = 20) {
  if (value === null || value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) {
    throw new AppError('Limit tidak valid.', 400, 'VALIDATION_ERROR');
  }
  const limit = Number(value);
  if (limit < 1 || limit > 50) {
    throw new AppError('Limit harus berada di antara 1 dan 50.', 400, 'VALIDATION_ERROR');
  }
  return limit;
}

function validateOffset(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (!/^\d+$/.test(String(value))) {
    throw new AppError('Offset tidak valid.', 400, 'VALIDATION_ERROR');
  }
  const offset = Number(value);
  if (!Number.isSafeInteger(offset) || offset > 100_000) {
    throw new AppError('Offset terlalu besar.', 400, 'VALIDATION_ERROR');
  }
  return offset;
}

module.exports = {
  validateLimit,
  validateOffset,
  validateUuid
};
