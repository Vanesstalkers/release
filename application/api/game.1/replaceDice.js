({
  access: 'public',
  method: async ({ gameId, diceId, zoneId }) => {
    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const dice = game.getObjectById(diceId);
    const zone = game.getObjectById(zoneId);
    dice.moveToTarget(zone);

    const $set = { ...game };
    delete $set._id;
    await db.mongo.updateOne(
      'game',
      { _id: db.mongo.ObjectID(gameId) },
      { $set }
    );

    domain.db.broadcastData({
      game: { [gameId]: game },
    });

    return { status: 'ok' };
  },
});
