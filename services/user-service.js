const { getDatabase } = require('../config/database');
const { throwDatabaseError } = require('../database/errors');
const { createUserModel, toPublicUser } = require('../models/user');
const { createRegistrationModel, toPublicRegistration } = require('../models/registration');
const { hashPassword } = require('./password-service');

async function registerUser(input) {
  const db = getDatabase();
  const user = createUserModel({ ...input, role: 'participant' });
  const passwordHash = await hashPassword(input.password);
  const registration = createRegistrationModel(input, 'pending');
  const { data, error } = await db.rpc('register_participant', {
    p_avatar: user.avatar,
    p_category: registration.category,
    p_email: user.email,
    p_faculty: registration.faculty,
    p_fullname: user.fullname,
    p_password_hash: passwordHash,
    p_phone: registration.phone,
    p_team_name: registration.team_name,
    p_university: registration.university
  });
  throwDatabaseError(error, 'Gagal menyimpan data registrasi.');

  return {
    registration: toPublicRegistration(data.registration),
    user: toPublicUser(data.user)
  };
}

async function getUserWithRegistration(userId) {
  if (!userId) return null;

  const db = getDatabase();
  const { data, error } = await db
    .from('users')
    .select(`
      id,
      fullname,
      email,
      avatar,
      role,
      created_at,
      registrations (
        phone,
        university,
        faculty,
        team_name,
        category,
        created_at
      )
    `)
    .eq('id', userId)
    .maybeSingle();
  throwDatabaseError(error, 'Gagal mengambil data pengguna.');

  if (!data) return null;
  const registration = Array.isArray(data.registrations)
    ? data.registrations[0]
    : data.registrations;

  return {
    registration: toPublicRegistration(registration),
    user: toPublicUser(data)
  };
}

module.exports = {
  getUserWithRegistration,
  registerUser
};
