async (context, { gameId }) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const { userId, gameId: currentGameId } = session;
  if (currentGameId) throw new Error('Уже подключен к другой игре');

  const user = lib.store('user').get(userId);
  for (const session of user.sessions()) {
    // на случай повторного вызова api до обработки playerJoin
    // (session.saveChanges будет выполнен в user.joinGame)
    session.set({ gameId });
  }

  lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', {
    userId,
    userName: user.name || user.login,
  });
  return { status: 'ok' };
};
