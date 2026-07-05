const { getDatabase } = require('../config/database');
const { throwDatabaseError } = require('../database/errors');
const {
  createChatHistoryModel,
  toPublicChat
} = require('../models/chat-history');

async function saveChat(entry) {
  const db = getDatabase();
  const record = createChatHistoryModel(entry);
  const { data, error } = await db
    .from('chat_history')
    .insert(record)
    .select('id, prompt, response, created_at')
    .single();
  throwDatabaseError(error, 'Gagal menyimpan riwayat chat.');
  return toPublicChat(data);
}

async function listChats(visitorId, limit = 10) {
  const db = getDatabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  const { data, error } = await db
    .from('chat_history')
    .select('id, prompt, response, created_at')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  throwDatabaseError(error, 'Gagal mengambil riwayat chat.');

  return (data || []).reverse().map(toPublicChat);
}

function chatsToAiHistory(chats) {
  return chats.flatMap(chat => [
    { role: 'user', content: chat.prompt },
    { role: 'assistant', content: chat.response }
  ]);
}

module.exports = {
  chatsToAiHistory,
  listChats,
  saveChat
};
