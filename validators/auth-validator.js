const { AppError } = require('../database/errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new AppError('Alamat email tidak valid.', 400, 'VALIDATION_ERROR');
  }
  return email;
}

function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new AppError(
      'Password harus berisi 8–128 karakter.',
      400,
      'VALIDATION_ERROR'
    );
  }
  return value;
}

function validateRemember(value) {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') {
    throw new AppError('Nilai remember harus berupa boolean.', 400, 'VALIDATION_ERROR');
  }
  return value;
}

function validateRegister(input) {
  const fullname = typeof input?.fullname === 'string' ? input.fullname.trim() : '';
  if (fullname.length < 2 || fullname.length > 120) {
    throw new AppError('Nama lengkap tidak valid.', 400, 'VALIDATION_ERROR');
  }

  return {
    email: validateEmail(input.email),
    fullname,
    password: validatePassword(input.password),
    remember: validateRemember(input.remember)
  };
}

function validateLogin(input) {
  return {
    email: validateEmail(input?.email),
    password: validatePassword(input?.password),
    remember: validateRemember(input?.remember)
  };
}

function validateForgotPassword(input) {
  return { email: validateEmail(input?.email) };
}

function validateResetPassword(input) {
  return { password: validatePassword(input?.password) };
}

function validateEmailVerification(input) {
  const email = input?.email === undefined ? undefined : validateEmail(input.email);
  const token = typeof input?.token === 'string' ? input.token.trim() : '';
  const tokenHash = typeof input?.tokenHash === 'string' ? input.tokenHash.trim() : '';

  if ((!email || !token) && !tokenHash) {
    throw new AppError(
      'Email dan token, atau tokenHash, wajib diisi.',
      400,
      'VALIDATION_ERROR'
    );
  }
  return {
    email,
    remember: validateRemember(input?.remember),
    token,
    tokenHash
  };
}

module.exports = {
  validateEmail,
  validateEmailVerification,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword
};
