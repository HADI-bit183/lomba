const { getDatabase } = require('../config/database');
const { AppError, throwDatabaseError } = require('../database/errors');
const { toPublicChat } = require('../models/chat-history');
const { toPublicUser } = require('../models/user');

function mapAdminChat(record) {
  const user = Array.isArray(record.users) ? record.users[0] : record.users;
  return {
    ...toPublicChat(record),
    user: user
      ? {
          id: user.id,
          fullname: user.fullname,
          email: user.email
        }
      : null
  };
}

async function listUsers(limit, offset) {
  const db = getDatabase();
  const { data, error, count } = await db
    .from('users')
    .select(
      'id, fullname, email, avatar, role, last_login_at, total_chat, total_login, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  throwDatabaseError(error, 'Gagal mengambil daftar pengguna.');
  return {
    data: (data || []).map(toPublicUser),
    total: count || 0
  };
}

async function listChats(limit, offset) {
  const db = getDatabase();
  const { data, error, count } = await db
    .from('chat_history')
    .select(`
      id,
      prompt,
      response,
      created_at,
      users (
        id,
        fullname,
        email
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  throwDatabaseError(error, 'Gagal mengambil daftar chat.');
  return {
    data: (data || []).map(mapAdminChat),
    total: count || 0
  };
}

async function getAdminStatistics() {
  const db = getDatabase();
  const [
    { data: totals, error: totalsError },
    recentUsers,
    recentChats
  ] = await Promise.all([
    db.rpc('get_admin_statistics'),
    listUsers(5, 0),
    listChats(5, 0)
  ]);
  throwDatabaseError(totalsError, 'Gagal mengambil statistik admin.');

  return {
    recentChats: recentChats.data,
    recentUsers: recentUsers.data,
    totalChats: Number(totals.total_chats || 0),
    totalChatsToday: Number(totals.total_chats_today || 0),
    totalLogins: Number(totals.total_logins || 0),
    totalUsers: Number(totals.total_users || 0)
  };
}

async function deleteUserById(userId, requestUserId) {
  if (userId === requestUserId) {
    throw new AppError('Tidak dapat menghapus akun sendiri.', 403, 'FORBIDDEN');
  }

  const db = getDatabase();
  
  // Get user details
  const { data: user, error: findError } = await db
    .from('users')
    .select('id, auth_user_id, role')
    .eq('id', userId)
    .single();
    
  if (findError) throwDatabaseError(findError, 'Gagal mencari pengguna.');
  if (!user) return; // Already deleted
  
  // Protect last admin
  if (user.role === 'admin') {
    const { count, error: countError } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    
    if (countError) throwDatabaseError(countError, 'Gagal menghitung jumlah admin.');
    if (count <= 1) {
      throw new AppError('Tidak dapat menghapus admin terakhir.', 403, 'FORBIDDEN');
    }
  }
  
  // 1. Delete associated data (no CASCADE in schema)
  await db.from('registrations').delete().eq('user_id', user.id);
  await db.from('chat_history').delete().eq('user_id', user.id);
  
  // 2. Delete from public.users
  const { error: delError } = await db.from('users').delete().eq('id', user.id);
  if (delError) throwDatabaseError(delError, 'Gagal menghapus pengguna.');
  
  // 3. Delete from auth.users (if it's linked)
  if (user.auth_user_id) {
    const { error: authError } = await db.auth.admin.deleteUser(user.auth_user_id);
    if (authError) console.error('Failed to delete auth user:', authError.message);
  }
}

module.exports = {
  deleteUserById,
  getAdminStatistics,
  listChats,
  listUsers
};
