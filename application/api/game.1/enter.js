({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      const gameData = await db.mongo.findOne('game', gameId);
      if (!gameData) throw new Error('Game not found');
      if (gameData.finished) throw new Error('Game finished');
      const game = await new domain.game.class({ _id: gameId }).fromJSON(gameData);
      domain.db.data.game[gameId] = game;

      lib.broadcaster.subscribe({ context, room: game });

      const data = game.prepareFakeData({
        userId: context.client.userId,
        data: { ...game.store, game: { [gameId]: { ...game, store: undefined } } },
      });
      context.client.emit('db/smartUpdated', data);

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
