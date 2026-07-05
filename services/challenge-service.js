const { getDatabase } = require('../config/database');
const { throwDatabaseError } = require('../database/errors');
const { AppError } = require('../database/errors');

const CHALLENGE_XP = [15, 10, 20, 5, 15];

function jakartaDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Jakarta',
    year: 'numeric'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function expectedXpForDate(date) {
  const challengeDay = new Date(`${date}T00:00:00Z`);
  const challengeSeed = [
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][challengeDay.getUTCDay()],
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
      challengeDay.getUTCMonth()
    ],
    String(challengeDay.getUTCDate()).padStart(2, '0'),
    challengeDay.getUTCFullYear()
  ].join(' ');

  let hash = 0;
  for (let index = 0; index < challengeSeed.length; index += 1) {
    hash = challengeSeed.charCodeAt(index) + ((hash << 5) - hash);
  }
  return CHALLENGE_XP[Math.abs(hash) % CHALLENGE_XP.length];
}

function toPublicProgress(record) {
  return {
    totalXP: record?.total_xp || 0,
    lastCompletedDate: record?.last_completed_on || null
  };
}

async function getProgress(visitorId) {
  const db = getDatabase();
  const { data, error } = await db
    .from('challenge_progress')
    .select('total_xp, last_completed_on')
    .eq('visitor_id', visitorId)
    .maybeSingle();
  throwDatabaseError(error, 'Gagal mengambil progres tantangan.');
  return toPublicProgress(data);
}

async function completeChallenge({ challengeDate, userId, visitorId, xp }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(challengeDate || '') || challengeDate !== jakartaDate()) {
    throw new AppError('Tanggal tantangan tidak valid.', 400, 'VALIDATION_ERROR');
  }

  if (!Number.isInteger(xp) || xp !== expectedXpForDate(challengeDate)) {
    throw new AppError('Nilai XP tidak valid.', 400, 'VALIDATION_ERROR');
  }

  const db = getDatabase();
  const { data, error } = await db.rpc('complete_daily_challenge', {
    p_challenge_date: challengeDate,
    p_user_id: userId || null,
    p_visitor_id: visitorId,
    p_xp: xp
  });
  throwDatabaseError(error, 'Gagal menyimpan progres tantangan.');
  return toPublicProgress(data);
}

module.exports = {
  completeChallenge,
  getProgress
};
