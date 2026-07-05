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

  let avatar = null;
  if (input.avatar !== undefined && input.avatar !== null && input.avatar !== '') {
    if (typeof input.avatar !== 'string' || input.avatar.trim().length > 2048) {
      throw new AppError('Avatar tidak valid.', 400, 'VALIDATION_ERROR');
    }
    avatar = input.avatar.trim();
  }

  return {
    avatar,
    email,
    fullname,
    role
  };
}

function createUserUpdateModel(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('Data pengguna tidak valid.', 400, 'VALIDATION_ERROR');
  }

  const update = {};
  if (Object.hasOwn(input, 'fullname')) {
    update.fullname = cleanText(input.fullname, 'Nama lengkap', 2, 120);
  }
  if (Object.hasOwn(input, 'email')) {
    const email = typeof input.email === 'string'
      ? input.email.trim().toLowerCase()
      : '';
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      throw new AppError('Alamat email tidak valid.', 400, 'VALIDATION_ERROR');
    }
    update.email = email;
  }
  if (Object.hasOwn(input, 'avatar')) {
    if (input.avatar === null || input.avatar === '') {
      update.avatar = null;
    } else if (typeof input.avatar === 'string' && input.avatar.trim().length <= 2048) {
      update.avatar = input.avatar.trim();
    } else {
      throw new AppError('Avatar tidak valid.', 400, 'VALIDATION_ERROR');
    }
  }

  if (Object.hasOwn(input, 'role')) {
    throw new AppError('Role tidak dapat diubah melalui endpoint ini.', 400, 'VALIDATION_ERROR');
  }

  const hasPassword = Object.hasOwn(input, 'password');
  if (hasPassword) {
    throw new AppError(
      'Gunakan endpoint /api/auth/reset-password untuk mengubah password.',
      400,
      'VALIDATION_ERROR'
    );
  }
  if (!Object.keys(update).length && !hasPassword) {
    throw new AppError(
      'Kirim minimal satu field yang dapat diperbarui.',
      400,
      'VALIDATION_ERROR'
    );
  }

  return { hasPassword, update };
}

function toPublicUser(record) {
  return {
    id: record.id,
    fullname: record.fullname,
    email: record.email,
    avatar: record.avatar,
    role: record.role,
    lastLoginAt: record.last_login_at || null,
    totalChat: Number(record.total_chat || 0),
    totalLogin: Number(record.total_login || 0),
    createdAt: record.created_at
  };
}

module.exports = {
  cleanText,
  createUserModel,
  createUserUpdateModel,
  toPublicUser
};
