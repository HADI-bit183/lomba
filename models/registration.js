const { AppError } = require('../database/errors');
const { cleanText } = require('./user');

const CATEGORIES = new Set(['static', 'dynamic', 'framework']);

function createRegistrationModel(input, userId) {
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  if (!CATEGORIES.has(category)) {
    throw new AppError('Kategori kompetisi tidak valid.', 400, 'VALIDATION_ERROR');
  }

  return {
    category,
    faculty: cleanText(input.faculty, 'Fakultas', 2, 160),
    phone: cleanText(input.phone, 'Nomor telepon', 8, 24),
    team_name: cleanText(input.teamName, 'Nama tim', 2, 120),
    university: cleanText(input.university, 'Universitas', 2, 180),
    user_id: userId
  };
}

function toPublicRegistration(record) {
  if (!record) return null;
  return {
    phone: record.phone,
    university: record.university,
    faculty: record.faculty,
    teamName: record.team_name,
    category: record.category,
    createdAt: record.created_at
  };
}

module.exports = {
  createRegistrationModel,
  toPublicRegistration
};
