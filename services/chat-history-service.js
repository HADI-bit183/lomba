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

async function listChats(userId, limit = 10) {
  const db = getDatabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  const { data, error } = await db
    .from('chat_history')
    .select('id, prompt, response, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  throwDatabaseError(error, 'Gagal mengambil riwayat chat.');

  return (data || []).reverse().map(toPublicChat);
}

async function deleteChat(chatId, userId) {
  const db = getDatabase();
  const { data, error } = await db
    .from('chat_history')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  throwDatabaseError(error, 'Gagal menghapus riwayat chat.');

  if (!data) {
    throw new NotFoundError('Chat tidak ditemukan.');
  }
}

async function deleteChatHistory(userId) {
  const db = getDatabase();
  const { error } = await db
    .from('chat_history')
    .delete()
    .eq('user_id', userId);
  throwDatabaseError(error, 'Gagal menghapus seluruh riwayat chat.');
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
  deleteChatHistory,
  listChats,
  saveChat
};
