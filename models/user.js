const { AppError } = require('../database/errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set(['participant', 'mentor', 'admin']);

function cleanText(value, field, minLength, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < minLength || text.length > maxLength) {
    throw new AppError(`${field} tidak valid.`, 400, 'VALIDATION_ERROR');
  }
  return text;
}

function createUserModel(input) {
  const fullname = cleanText(input.fullname, 'Nama lengkap', 2, 120);
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const role = input.role || 'participant';

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new AppError('Alamat email tidak valid.', 400, 'VALIDATION_ERROR');
  }

  if (!ALLOWED_ROLES.has(role)) {
    throw new AppError('Role pengguna tidak valid.', 400, 'VALIDATION_ERROR');
  }

  return {
    avatar: typeof input.avatar === 'string' && input.avatar.trim()
      ? input.avatar.trim().slice(0, 2048)
      : null,
    email,
    fullname,
    role
  };
}

function toPublicUser(record) {
  return {
    id: record.id,
    fullname: record.fullname,
    email: record.email,
    avatar: record.avatar,
    role: record.role,
    createdAt: record.created_at
  };
}

module.exports = {
  cleanText,
  createUserModel,
  toPublicUser
};
