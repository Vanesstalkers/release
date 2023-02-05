({
  access: 'public',
  method: async ({ gameId, diceId }) => {
    const game = new domain.game.class({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const dice = game.getObjectById(diceId);
    const zone = dice.getParent();

    dice.deleted = true;
    zone.updateValues();

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
