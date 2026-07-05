const { getDatabase } = require('../config/database');
const { NotFoundError, throwDatabaseError } = require('../database/errors');
const {
  createChatHistoryModel,
  toPublicChat
} = require('../models/chat-history');

async function saveChat(entry) {
  const record = createChatHistoryModel(entry);
  const db = getDatabase();
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

async function deleteChat(chatId, visitorId) {
  const db = getDatabase();
  const { data, error } = await db
    .from('chat_history')
    .delete()
    .eq('id', chatId)
    .eq('visitor_id', visitorId)
    .select('id')
    .maybeSingle();
  throwDatabaseError(error, 'Gagal menghapus riwayat chat.');

  if (!data) {
    throw new NotFoundError('Chat tidak ditemukan.');
  }
}

function chatsToAiHistory(chats) {
  return chats.flatMap(chat => [
    { role: 'user', content: chat.prompt },
    { role: 'assistant', content: chat.response }
  ]);
}

module.exports = {
  chatsToAiHistory,
  deleteChat,
  listChats,
  saveChat
};
