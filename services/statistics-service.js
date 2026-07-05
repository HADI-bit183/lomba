const { getDatabase } = require('../config/database');
const { throwDatabaseError } = require('../database/errors');
const { checkAchievements } = require('./achievement-service');
const { getUserById } = require('./user-service');

async function getUserStatistics(userId) {
  const db = getDatabase();
  const [profile, achievements] = await Promise.all([
    getUserById(userId),
    checkAchievements(userId)
  ]);

  const { data: activity, error } = await db.rpc('get_user_daily_activity', {
    p_days: 30,
    p_user_id: userId
  });
  throwDatabaseError(error, 'Gagal mengambil aktivitas harian.');

  return {
    accountCreatedAt: profile.user.createdAt,
    dailyActivity: (activity || []).map(item => ({
      date: item.activity_date,
      totalChat: Number(item.chat_count || 0)
    })),
    lastLoginAt: profile.user.lastLoginAt,
    totalAchievement: achievements.length,
    totalChat: profile.user.totalChat
  };
}

module.exports = { getUserStatistics };
