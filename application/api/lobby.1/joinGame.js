({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      // const game = domain.game.lobby.games.get(gameId);
      const game = lib.repository.getStore('lobby', 'main').games.get(gameId);
      const { _id: playerId } = await game.userJoin({ userId: context.client.userId });
      context.gameId = gameId.toString();
      context.playerId = playerId.toString();

      await game.broadcastData();
      context.client.emit('session/joinGame', { gameId, playerId });

      return 'ok';
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
