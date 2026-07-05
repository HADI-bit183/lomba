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

  if (isDirectChatCreate(input)) {
    const chat = await saveChat({
      prompt: input.prompt,
      response: input.response,
      userId: session.userId,
      visitorId: session.visitorId
    });
    response.setHeader('Location', `/api/chat/${chat.id}`);
    sendJson(response, 201, { chat });
    return;
  }

  const { message } = validateAiChatInput(input);
  const chats = await listChats(session.visitorId, 5);
  const answer = await generateAnswer(message, chatsToAiHistory(chats));
  const chat = await saveChat({
    prompt: message,
    response: answer,
    userId: session.userId,
    visitorId: session.visitorId
  });
  response.setHeader('Location', `/api/chat/${chat.id}`);
  sendJson(response, 201, { answer, chat });
}

async function history(request, response, params, requestUrl) {
  const session = getOrCreateSession(request, response);
  const limit = validateLimit(requestUrl.searchParams.get('limit'), 20);
  const chats = await listChats(session.visitorId, limit);
  sendJson(response, 200, { chats });
}

async function remove(request, response, params) {
  const chatId = validateUuid(params.id, 'ID chat');
  const session = getOrCreateSession(request, response);
  await deleteChat(chatId, session.visitorId);
  sendNoContent(response);
}

module.exports = {
  create,
  history,
  remove
};
