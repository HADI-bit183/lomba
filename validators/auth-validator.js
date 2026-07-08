const { z } = require('zod');
const { parseOrThrow, validationError } = require('./zod-utils');

const emailSchema = z.preprocess(
  value => typeof value === 'string' ? value.trim().toLowerCase() : value,
  z.string({
    invalid_type_error: 'Alamat email tidak valid.',
    required_error: 'Alamat email tidak valid.'
  })
    .email('Alamat email tidak valid.')
    .max(254, 'Alamat email tidak valid.')
);

const passwordSchema = z.string({
  invalid_type_error: 'Password harus berisi 8-128 karakter.',
  required_error: 'Password harus berisi 8-128 karakter.'
})
  .min(8, 'Password harus berisi 8-128 karakter.')
  .max(128, 'Password harus berisi 8-128 karakter.');

const rememberSchema = z.preprocess(
  value => value === undefined ? false : value,
  z.boolean({
    invalid_type_error: 'Nilai remember harus berupa boolean.'
  })
);

const registerSchema = z.object({
  email: emailSchema,
  fullname: z.preprocess(
    value => typeof value === 'string' ? value.trim() : value,
    z.string({
      invalid_type_error: 'Nama lengkap tidak valid.',
      required_error: 'Nama lengkap tidak valid.'
    })
      .min(2, 'Nama lengkap tidak valid.')
      .max(120, 'Nama lengkap tidak valid.')
  ),
  password: passwordSchema,
  remember: rememberSchema
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: rememberSchema
});

const forgotPasswordSchema = z.object({
  email: emailSchema
});

const resetPasswordSchema = z.object({
  password: passwordSchema
});

function validateEmail(value) {
  return parseOrThrow(emailSchema, value);
}

function validatePassword(value) {
  return parseOrThrow(passwordSchema, value);
}

function validateRemember(value) {
  return parseOrThrow(rememberSchema, value);
}

function validateRegister(input) {
  return parseOrThrow(registerSchema, input);
}

function validateLogin(input) {
  return parseOrThrow(loginSchema, input);
}

function validateForgotPassword(input) {
  return parseOrThrow(forgotPasswordSchema, input);
}

function validateResetPassword(input) {
  return parseOrThrow(resetPasswordSchema, input);
}

function validateEmailVerification(input) {
  const email = input?.email === undefined ? undefined : validateEmail(input.email);
  const token = typeof input?.token === 'string' ? input.token.trim() : '';
  const tokenHash = typeof input?.tokenHash === 'string' ? input.tokenHash.trim() : '';

  if ((!email || !token) && !tokenHash) {
    throw validationError('Email dan token, atau tokenHash, wajib diisi.');
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
  validatePassword,
  validateRegister,
  validateRemember,
  validateResetPassword
};
