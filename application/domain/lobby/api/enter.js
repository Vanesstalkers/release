async (context) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const user = lib.store('user').get(userId);

  if (session.gameId) {
    const gameLoaded = await db.redis.hget('games', session.gameId);
    if (gameLoaded) {
      session.send('session/joinGame', { gameId: session.gameId, playerId: session.playerId });
      return { status: 'ok' };
    } else {
      session.set({ gameId: null, playerId: null });
      await session.saveChanges();
    }
  }

  const lobbyName = `lobby-main`;
  session.subscribe(lobbyName);
  context.client.events.close.unshift(() => {
    session.unsubscribe(lobbyName);
    user.leaveLobby({ sessionId });
  });
  await user.enterLobby({ sessionId });

  return { status: 'ok' };
};
