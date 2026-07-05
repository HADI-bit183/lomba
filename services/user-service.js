const { getDatabase } = require('../config/database');
const {
  AppError,
  NotFoundError,
  throwDatabaseError
} = require('../database/errors');
const {
  createUserModel,
  createUserUpdateModel,
  toPublicUser
} = require('../models/user');
const { createRegistrationModel, toPublicRegistration } = require('../models/registration');

const REGISTRATION_FIELDS = ['phone', 'university', 'faculty', 'teamName', 'category'];

function includesRegistration(input) {
  return REGISTRATION_FIELDS.some(field => Object.hasOwn(input, field));
}

async function createUser(input) {
  if (Object.hasOwn(input, 'password')) {
    throw new AppError(
      'Gunakan endpoint /api/auth/register untuk membuat akun dengan password.',
      400,
      'VALIDATION_ERROR'
    );
  }
  const user = createUserModel({ ...input, role: 'participant' });

  if (includesRegistration(input)) {
    const registration = createRegistrationModel(input, 'pending');
    const db = getDatabase();
    const { data, error } = await db.rpc('register_participant', {
      p_avatar: user.avatar,
      p_category: registration.category,
      p_email: user.email,
      p_faculty: registration.faculty,
      p_fullname: user.fullname,
      p_password_hash: null,
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
    .insert({ ...user, password_hash: null })
    .select('id, fullname, email, avatar, role, last_login_at, total_chat, created_at')
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
      last_login_at,
      total_chat,
      created_at,
      auth_user_id,
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

async function getUserByAuthId(authUserId) {
  const db = getDatabase();
  const { data, error } = await db
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  throwDatabaseError(error, 'Gagal mengambil profil autentikasi.');

  if (!data) {
    throw new NotFoundError('Profil pengguna tidak ditemukan.');
  }
  return getUserById(data.id);
}

async function ensureAuthProfile(authUser) {
  const db = getDatabase();
  const email = String(authUser.email || '').trim().toLowerCase();
  const fullname = String(
    authUser.user_metadata?.fullname ||
    authUser.user_metadata?.full_name ||
    email.split('@')[0] ||
    'NovaMind User'
  ).trim().slice(0, 120);

  const { data: linked, error: linkedError } = await db
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();
  throwDatabaseError(linkedError, 'Gagal memeriksa profil autentikasi.');
  if (linked) {
    const { error } = await db
      .from('users')
      .update({
        email,
        password_hash: null
      })
      .eq('id', linked.id);
    throwDatabaseError(error, 'Gagal menyinkronkan profil autentikasi.');
    return getUserById(linked.id);
  }

  const { data: existing, error: existingError } = await db
    .from('users')
    .select('id, auth_user_id')
    .eq('email', email)
    .maybeSingle();
  throwDatabaseError(existingError, 'Gagal memeriksa profil pengguna.');

  if (existing?.auth_user_id && existing.auth_user_id !== authUser.id) {
    throw new AppError(
      'Email tersebut sudah terhubung ke akun lain.',
      409,
      'AUTH_PROFILE_CONFLICT'
    );
  }

  if (existing) {
    const { error } = await db
      .from('users')
      .update({
        auth_user_id: authUser.id,
        password_hash: null
      })
      .eq('id', existing.id);
    throwDatabaseError(error, 'Gagal menghubungkan profil pengguna.');
    return getUserById(existing.id);
  }

  const { data, error } = await db
    .from('users')
    .insert({
      auth_user_id: authUser.id,
      avatar: authUser.user_metadata?.avatar_url || null,
      email,
      fullname: fullname.length >= 2 ? fullname : 'NovaMind User',
      password_hash: null,
      role: 'participant'
    })
    .select('id')
    .single();
  throwDatabaseError(error, 'Gagal membuat profil pengguna.');
  return getUserById(data.id);
}

async function updateUser(userId, input) {
  const { update } = createUserUpdateModel(input);

  const db = getDatabase();
  const { data, error } = await db
    .from('users')
    .update(update)
    .eq('id', userId)
    .select('id, fullname, email, avatar, role, last_login_at, total_chat, created_at')
    .maybeSingle();
  throwDatabaseError(error, 'Gagal memperbarui data pengguna.');

  if (!data) {
    throw new NotFoundError('Pengguna tidak ditemukan.');
  }

  return toPublicUser(data);
}

async function recordLastLogin(userId, occurredAt = new Date().toISOString()) {
  const db = getDatabase();
  const { error } = await db
    .from('users')
    .update({ last_login_at: occurredAt })
    .eq('id', userId);
  throwDatabaseError(error, 'Gagal menyimpan waktu login terakhir.');
  return getUserById(userId);
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
  ensureAuthProfile,
  getUserByAuthId,
  getUserById,
  getUserWithRegistration: getUserById,
  registerUser: createUser,
  recordLastLogin,
  updateUser
};
