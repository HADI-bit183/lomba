const { getDatabase } = require('../config/database');
const { NotFoundError, throwDatabaseError } = require('../database/errors');
const {
  createUserModel,
  createUserUpdateModel,
  toPublicUser
} = require('../models/user');
const { createRegistrationModel, toPublicRegistration } = require('../models/registration');
const { hashPassword } = require('./password-service');

const REGISTRATION_FIELDS = ['phone', 'university', 'faculty', 'teamName', 'category'];

function includesRegistration(input) {
  return REGISTRATION_FIELDS.some(field => Object.hasOwn(input, field));
}

async function createUser(input) {
  const user = createUserModel({ ...input, role: 'participant' });
  const passwordHash = await hashPassword(input.password);

  if (includesRegistration(input)) {
    const registration = createRegistrationModel(input, 'pending');
    const db = getDatabase();
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
    throwDatabaseError(error, 'Gagal menyimpan data pengguna.');

    return {
      registration: toPublicRegistration(data.registration),
      user: toPublicUser(data.user)
    };
  }

  const db = getDatabase();
  const { data, error } = await db
    .from('users')
    .insert({ ...user, password_hash: passwordHash })
    .select('id, fullname, email, avatar, role, created_at')
    .single();
  throwDatabaseError(error, 'Gagal menyimpan data pengguna.');

  return {
    registration: null,
    user: toPublicUser(data)
  };
}

async function getUserById(userId) {
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

  if (!data) {
    throw new NotFoundError('Pengguna tidak ditemukan.');
  }
  const registration = Array.isArray(data.registrations)
    ? data.registrations[0]
    : data.registrations;

  return {
    registration: toPublicRegistration(registration),
    user: toPublicUser(data)
  };
}

async function updateUser(userId, input) {
  const { hasPassword, update } = createUserUpdateModel(input);
  if (hasPassword) {
    update.password_hash = await hashPassword(input.password);
  }

  const db = getDatabase();
  const { data, error } = await db
    .from('users')
    .update(update)
    .eq('id', userId)
    .select('id, fullname, email, avatar, role, created_at')
    .maybeSingle();
  throwDatabaseError(error, 'Gagal memperbarui data pengguna.');

  if (!data) {
    throw new NotFoundError('Pengguna tidak ditemukan.');
  }

  return toPublicUser(data);
}

async function deleteUser(userId) {
  const db = getDatabase();
  const { data, error } = await db
    .from('users')
    .delete()
    .eq('id', userId)
    .select('id')
    .maybeSingle();
  throwDatabaseError(error, 'Gagal menghapus pengguna.');

  if (!data) {
    throw new NotFoundError('Pengguna tidak ditemukan.');
  }
}

module.exports = {
  createUser,
  deleteUser,
  getUserById,
  getUserWithRegistration: getUserById,
  registerUser: createUser,
  updateUser
};
