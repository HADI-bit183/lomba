class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Autentikasi diperlukan.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki izin untuk mengakses data ini.') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
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
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  throwDatabaseError
};
