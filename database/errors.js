class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function throwDatabaseError(error, fallbackMessage) {
  if (!error) return;

  console.error('Supabase operation failed:', error.code || 'unknown', error.message);

  if (error.code === '23505') {
    throw new AppError('Data tersebut sudah terdaftar.', 409, 'DUPLICATE_RECORD');
  }

  if (error.code === '23503') {
    throw new AppError('Data terkait tidak ditemukan.', 400, 'INVALID_REFERENCE');
  }

  throw new AppError(fallbackMessage, 502, 'DATABASE_ERROR');
}

module.exports = {
  AppError,
  throwDatabaseError
};
