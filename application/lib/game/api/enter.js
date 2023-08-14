async (context, { gameId }) => {
  try {
    const { sessionId } = context;
    const session = lib.store('session').get(sessionId);
    if (gameId && gameId !== session.gameId) throw new Error('Пользователь не участвует в игре');
    const user = session.user();

    const gameLoaded = await db.redis.hget('games', gameId);
    if (!gameLoaded) throw new Error('Игра была отменена');
    
    session.subscribe(`game-${gameId}`, { rule: 'vue-store', userId: user.id() });
    context.client.events.close.unshift(() => {
      session.unsubscribe(`game-${gameId}`);
    });

    return { status: 'ok', gameId, playerId: user.playerId };
  } catch (err) {
    console.log(err);
    return { status: 'err', message: err.message, hideMessage: err.stack };
  }
};
