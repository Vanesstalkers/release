async (context, { gameId }) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const { userId, gameId: currentGameId } = session;
  if (currentGameId) throw new Error('Уже подключен к другой игре');
  lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', { userId });
  return { status: 'ok' };
};
