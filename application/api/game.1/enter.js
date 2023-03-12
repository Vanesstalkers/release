({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      let game = domain.db.data.game[gameId];
      if (!game) {
        const gameData = await db.mongo.findOne('game', gameId);
        if (!gameData) throw new Error('Game not found');
        if (gameData.finished) throw new Error('Game finished');
        game = new domain.game.class({ _id: gameId }).fromJSON(gameData);
        domain.db.data.game[gameId] = game;
      }

      domain.db.subscribe({ name: 'game-' + gameId, client: context.client, type: 'game' });

      const room = domain.db.getRoom('game-' + game._id);
      for (const [client] of room) {
        const { userId } = domain.db.data.session.get(client);
        const data = game.prepareBroadcastData(userId, {
          ...game.store,
          game: { [gameId]: { ...game, store: undefined } },
        });
        client.emit('db/smartUpdated', data);
      }

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
