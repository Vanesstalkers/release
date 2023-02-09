({
  access: 'public',
  method: async ({ gameId }) => {
    const game = await db.mongo.findOne('game', gameId);

    if (!game) return { status: 'error', msg: 'Game not found' };

    domain.db.subscribe({
      name: 'game-' + gameId,
      client: context.client,
      type: 'game',
    });

    domain.db.broadcastData(
      {
        game: { [gameId]: game },
      },
      { client: context.client }
    );
    domain.db.broadcast({
      room: `game-${gameId}`,
      data: { ...game.store },
    });

    return { status: 'ok' };
  },
});
