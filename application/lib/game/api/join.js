async (context, { gameId }) => {
  const { userId, gameId: currentGameId } = context;
  if (currentGameId) throw new Error('Уже подключен к другой игре');
  lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', { userId });
  return { status: 'ok' };
};
