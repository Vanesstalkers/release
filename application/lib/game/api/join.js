async (context, { gameId }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { userId } = session;
  const user = session.user();
  if (user.gameId) throw new Error('Уже подключен к другой игре');

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
