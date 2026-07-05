const { getDatabase } = require('../config/database');
const { throwDatabaseError } = require('../database/errors');
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

module.exports = {
  getAdminStatistics,
  listChats,
  listUsers
};
