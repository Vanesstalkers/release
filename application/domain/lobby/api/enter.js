async (context, { lobbyId }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();

  const lobbyName = `lobby-${lobbyId}`;
  session.subscribe(lobbyName, { rule: 'vue-store', userId: user.id() });

  session.onClose.push(async () => {
    if (session.lobbyId !== lobbyId) return; // уже вышел из лобби

    session.unsubscribe(lobbyName);
    session.set({ lobbyId: null });
    await session.saveChanges();

    user.leaveLobby({ sessionId, lobbyId });
  });
  await user.enterLobby({ sessionId, lobbyId });

  const { gameId, playerId } = user;
  if (gameId) {
    const gameLoaded = await db.redis.hget('games', gameId);
    if (gameLoaded) {
      session.set({ gameId, playerId, lobbyId });
      await session.saveChanges();
      session.send('session/joinGame', { gameId, playerId });
    } else {
      if (!gameLoaded) {
        user.set({ gameId: null, playerId: null });
        await user.saveChanges();

        session.set({ lobbyId });
        for (const session of user.sessions()) {
          session.set({ gameId: null, playerId: null });
          await session.saveChanges();
        }
        return { status: 'ok' };

        // данная реализация восстанавливает игру с ошибкой
        // + не продуман сценарий восстановления игры для нескольких игроков
        await new domain.game.class()
          .load({ fromDB: { id: gameId } })
          .then((game) => {
            lib.store.broadcaster.publishAction(lobbyName, 'addGame', { id: gameId });
            user.joinGame({ gameId, playerId });
            lib.timers.timerRestart(game);
          })
          .catch(async (err) => {
            if (err === 'not_found') {
              user.set({ gameId: null, playerId: null });
              await user.saveChanges();
            } else throw err;
          });
      }
    }
  } else {
    session.set({ lobbyId });
    await session.saveChanges();
  }

  return { status: 'ok' };
};
