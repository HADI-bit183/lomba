const crypto = require('crypto');
const { promisify } = require('util');
const { AppError } = require('../database/errors');

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  if (password === undefined || password === null) return null;
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new AppError(
      'Password harus berisi 8–128 karakter.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

module.exports = { hashPassword };
