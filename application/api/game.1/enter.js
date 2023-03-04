({
  access: 'public',
  method: async ({ gameId }) => {
    const gameData = await db.mongo.findOne('game', gameId);
    if (!gameData) return { status: 'error', msg: 'Game not found' };
    const game = new domain.game.class({ _id: gameId }).fromJSON(gameData);

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
  },
});
