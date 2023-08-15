async (context, {} = {}) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const { userId, gameId: currentGameId } = session;
  if (!currentGameId) throw new Error('Не участвует в игре');

  const gameLoaded = await db.redis.hget('games', currentGameId);
  if (gameLoaded) {
    lib.store.broadcaster.publishAction(`game-${currentGameId}`, 'playerLeave', { userId });
  } else {
    // игра была удалена вместе с каналом,`
    session.user().leaveGame();
  }

  return { status: 'ok' };
};
