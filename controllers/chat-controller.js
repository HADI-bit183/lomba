const {
  readJsonBody,
  sendJson,
  sendNoContent
} = require('../http/http-utils');
const { assertNotRateLimited } = require('../middleware/rate-limit');
const { generateAnswer } = require('../services/ai-service');
const {
  chatsToAiHistory,
  deleteChat,
  deleteChatHistory,
  listChats,
  saveChat
} = require('../services/chat-history-service');
const { getOrCreateSession } = require('../services/session-service');
const {
  isDirectChatCreate,
  validateAiChatInput
} = require('../validators/chat-validator');
const {
  validateLimit,
  validateUuid
} = require('../validators/common-validator');

async function create(request, response) {
  assertNotRateLimited(request);
  const input = await readJsonBody(request);
  const session = getOrCreateSession(request, response);
  const profileId = request.auth.profileId;

  if (isDirectChatCreate(input)) {
    const chat = await saveChat({
      prompt: input.prompt,
      response: input.response,
      userId: profileId,
      visitorId: session.visitorId
    });
    response.setHeader('Location', `/api/chat/${chat.id}`);
    sendJson(response, 201, { chat });
    return;
  }

  const { message } = validateAiChatInput(input);
  const chats = await listChats(profileId, 5);
  const answer = await generateAnswer(message, chatsToAiHistory(chats));
  const chat = await saveChat({
    prompt: message,
    response: answer,
    userId: profileId,
    visitorId: session.visitorId
  });
  response.setHeader('Location', `/api/chat/${chat.id}`);
  sendJson(response, 201, { answer, chat });
}

async function history(request, response, params, requestUrl) {
  const limit = validateLimit(requestUrl.searchParams.get('limit'), 20);
  const chats = await listChats(request.auth.profileId, limit);
  sendJson(response, 200, { chats });
}

async function remove(request, response, params) {
  const chatId = validateUuid(params.id, 'ID chat');
  await deleteChat(chatId, request.auth.profileId);
  sendNoContent(response);
}

async function clearHistory(request, response) {
  await deleteChatHistory(request.auth.profileId);
  sendNoContent(response);
}

module.exports = {
  create,
  clearHistory,
  history,
  remove
};
