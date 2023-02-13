({
  access: 'public',
  method: async ({ name: eventName, data: eventData }) => {
    const gameId = context.game;
    const user = await db.mongo.findOne('user', context.userId);
    const game = new domain.game.class({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    // if (user.game.toString() !== gameId)
    //   return {
    //     status: 'err',
    //     message:
    //       'Игрок не может совершить это действие, так как не участвует в игре',
    //   };

    if (user.player.toString() !== game.getActivePlayer()._id.toString())
      return {
        status: 'err',
        message:
          'Игрок не может совершить это действие, так как сейчас не его ход',
      };

    const event = domain.game[eventName];
    const result = await event(game, eventData);
    if (result.clearChanges) game.clearChanges();

    const changes = game.getChanges();
    if (Object.keys(changes).length) {
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
        data: changes,
      });
    }

    return result;
  },
});
