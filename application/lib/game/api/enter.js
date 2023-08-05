async (context, { gameId }) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  if (gameId && gameId !== session.gameId) throw new Error('Пользователь не участвует в игре');
  const user = session.user();

  session.subscribe(`game-${gameId}`, { rule: 'vue-store', userId: user.id() });
  context.client.events.close.unshift(() => {
    session.unsubscribe(`game-${gameId}`);
  });

  return { status: 'ok', gameId, playerId: user.playerId };
};
