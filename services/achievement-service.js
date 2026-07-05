const { getDatabase } = require('../config/database');
const { throwDatabaseError } = require('../database/errors');

function toPublicAchievement(record) {
  const achievement = Array.isArray(record.achievements)
    ? record.achievements[0]
    : record.achievements;

  return {
    id: record.id,
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    earnedAt: record.earned_at
  };
}

async function listAchievements(userId) {
  const db = getDatabase();
  const { data, error } = await db
    .from('user_achievements')
    .select(`
      id,
      earned_at,
      achievements (
        code,
        name,
        description
      )
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  throwDatabaseError(error, 'Gagal mengambil achievement.');
  return (data || []).map(toPublicAchievement);
}

async function checkAchievements(userId) {
  const db = getDatabase();
  const { data, error } = await db.rpc('check_user_achievements', {
    p_user_id: userId
  });
  throwDatabaseError(error, 'Gagal memeriksa achievement.');

  return (Array.isArray(data) ? data : []).map(record => ({
    id: record.id,
    code: record.code,
    name: record.name,
    description: record.description,
    earnedAt: record.earned_at
  }));
}

module.exports = {
  checkAchievements,
  listAchievements
};
