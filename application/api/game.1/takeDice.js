({
  access: 'public',
  method: async ({ gameId, diceId }) => {
    const game = new domain.game.class({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const player = game.getActivePlayer();
    const playerHand = player.getObjectByCode('Deck[domino]');
    const deck = game.getObjectByCode('Deck[domino]');
    for (let i = 0; i < 3; i++) {
      const item = deck.getRandomItem();
      if (item) item.moveToTarget(playerHand);
    }

    const $set = { ...game };
    delete $set._id;
    await db.mongo.updateOne(
      'game',
      { _id: db.mongo.ObjectID(gameId) },
      { $set }
    );

    domain.db.broadcast({
      smart: true,
      room: 'game-' + game._id,
      data: { ...game.getChanges() },
    });

    return { status: 'ok' };
  },
});
