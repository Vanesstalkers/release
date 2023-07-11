async (context, { gameId }) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const user = session.user();

  if (gameId !== user.gameId) throw new Error('Пользователь не участвует в игре');

  context.gameId = gameId;
  context.playerId = user.playerId;
  session.subscribe(`game-${gameId}`, { rule: 'vue-store', userId: user.id() });
  context.client.events.close.push(() => {
    session.unsubscribe(`game-${gameId}`);
  });

  return { status: 'ok', playerId: user.playerId };
};
