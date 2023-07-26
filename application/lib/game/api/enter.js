async (context, { gameId }) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  if (gameId !== session.gameId) throw new Error('Пользователь не участвует в игре');
  const user = session.user();

  if (gameId) {
    const gameLoaded = await db.redis.hget('games', gameId);
    if (!gameLoaded) {
      await new domain.game.class()
        .load({ fromDB: { id: gameId } })
        .then((game) => {
          lib.store.broadcaster.publishAction(`lobby-main`, 'addGame', { id: gameId });
          user.joinGame({ gameId, playerId: session.playerId });
          lib.timers.timerRestart(game);
        })
        .catch(async (err) => {
          if (err === 'not_found') {
            session.set({ gameId: null, playerId: null });
            await session.saveChanges();
            gameId = null;
          } else throw err;
        });
    }
  }

  if (gameId) {
    session.subscribe(`game-${gameId}`, { rule: 'vue-store', userId: user.id() });
    context.client.events.close.unshift(() => {
      session.unsubscribe(`game-${gameId}`);
    });
  }

  return { status: 'ok', gameId, playerId: user.playerId };
};
