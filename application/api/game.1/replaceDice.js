({
  access: 'public',
  method: async ({ gameId, diceId, zoneId }) => {

    const user = await db.mongo.findOne('user', context.userId);

    if (user.game.toString() !== gameId)
      return new Error('Игрок не может совершить это действие, так как не участвует в игре.');

    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    // !!! не забыть раскомментировать
    // if (user.player.toString() !== game.getActivePlayer()._id.toString())
    //   return new Error('Игрок не может совершить это действие, так как сейчас не его ход.');

    const dice = game.getObjectById(diceId);
    const zone = game.getObjectById(zoneId);

    const deletedDices = game.getDeletedDices();
    const replacedDice = deletedDices.find(dice => dice.getParent() == zone);
    const remainDeletedDices = deletedDices.filter(dice => dice != replacedDice);
    if (!replacedDice && remainDeletedDices.length)
      return { result: 'error', msg: 'Добавлять новые костяшки можно только взамен временно удаленных' };

    dice.moveToTarget(zone);

    const notReplacedDeletedDices = deletedDices.filter(dice => !dice.getParent().getNotDeletedItem());
    if (notReplacedDeletedDices.length === 0) { // все удаленные dice заменены
      const deck = game.getObjectByCode('Deck[domino]');
      deletedDices.forEach(dice => {
        dice.deleted = undefined;
        dice.moveToTarget(deck); // возвращаем удаленные dice в deck
      })
    }

    game.callEventHandlers({ handler: 'replaceDice' });

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
