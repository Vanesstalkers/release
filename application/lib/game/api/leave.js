async (context, {} = {}) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const { userId, gameId: currentGameId } = session;
  if (!currentGameId) throw new Error('Не участвует в игре');

  lib.store.broadcaster.publishAction(`game-${currentGameId}`, 'playerLeave', { userId });

  return { status: 'ok' };
};
