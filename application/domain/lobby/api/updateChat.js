async (context, { text }) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const user = lib.store('user').get(userId);
  lib.store.broadcaster.publishAction(`lobby-${session.lobbyId}`, 'updateChat', {
    text,
    // сохраняем user.name, потому что после перезапуска сервера в store может не быть нужного user
    user: { id: userId, name: user.name },
  });
  return { status: 'ok' };
};
