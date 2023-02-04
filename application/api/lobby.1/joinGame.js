({
  access: 'public',
  method: async ({ gameId }) => {
    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const player = game.getFreePlayerSlot();
    player.ready = 1;
    player.user = context.userId;

    const session = domain.db.data.session.get(context.client);
    const user = domain.db.data.user[session.userId];

    user.game = game._id;
    user.player = player._id;

    const deck = game.getObjectByCode('Deck[domino]');
    const playerHand = player.getObjectByCode('Deck[domino]');
    for (let i = 0; i < 3; i++) {
      const item = deck.getRandomItem();
      if (item) item.moveToTarget(playerHand);
    }

    const $set = { ...game };
    delete $set._id;
    await db.mongo.updateOne('game', game._id, { $set });
    await db.mongo.updateOne('user', user._id, { $set: user });

    domain.db.broadcast({
      room: 'game-' + game._id,
      data: { game: { [game._id]: game } },
    });
    domain.db.broadcast({
      room: 'user-' + user._id,
      data: { user: { [user._id]: user } },
    });
    context.client.emit('session/joinGame', {
      gameId: user.game,
      playerId: user.player,
    });

    return 'ok';
  },
});
