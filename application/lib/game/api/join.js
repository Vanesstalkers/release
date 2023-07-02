async (context, { gameId }) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  session.subscribe(`game-${gameId}`);
  lib.store.broadcaster.publishAction(`game-${gameId}`, 'userJoin', { userId });
//   session.gameId = gameId;
//   await session.saveState();
  return { status: 'ok' };
};
