({
  access: 'public',
  method: async ({ gameId, eventData = {} }) => {
    const user = await db.mongo.findOne('user', context.userId);

    if (user.game.toString() !== gameId)
      return new Error(
        'Игрок не может совершить это действие, так как не участвует в игре.'
      );

    const game = new domain.game.class({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    // !!! не забыть раскомментировать
    // if (user.player.toString() !== game.getActivePlayer()._id.toString())
    //   return new Error('Игрок не может совершить это действие, так как сейчас не его ход.');

    game.callEventHandlers({ handler: 'eventTrigger', data: eventData });

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

    return 'ok';
  },
});
