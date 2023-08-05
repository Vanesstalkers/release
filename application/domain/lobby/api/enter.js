async (context) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const user = lib.store('user').get(userId);

  const lobbyName = `lobby-main`;
  session.subscribe(lobbyName);
  context.client.events.close.unshift(() => {
    session.unsubscribe(lobbyName);
    user.leaveLobby({ sessionId });
  });
  await user.enterLobby({ sessionId });

  const { gameId, playerId } = user;
  if (gameId) {
    const gameLoaded = await db.redis.hget('games', gameId);
    if (gameLoaded) {
      session.set({ gameId, playerId });
      await user.saveChanges();
      session.send('session/joinGame', { gameId, playerId });
    } else {
      if (!gameLoaded) {
        await new domain.game.class()
          .load({ fromDB: { id: gameId } })
          .then((game) => {
            lib.store.broadcaster.publishAction(`lobby-main`, 'addGame', { id: gameId });
            user.joinGame({ gameId, playerId });
            lib.timers.timerRestart(game);
          })
          .catch(async (err) => {
            if (err === 'not_found') {
              user.set({ gameId: null, playerId: null });
              await user.saveChanges();
              gameId = null;
            } else throw err;
          });
      }
    }
  }

  return { status: 'ok' };
};
