({
  access: 'public',
  method: async ({ name: eventName, data: eventData }) => {
    try {
      const gameId = context.game;
      const user = await db.mongo.findOne('user', context.userId);
      const game = new domain.game.class({ _id: gameId }).fromJSON(await db.mongo.findOne('game', gameId));

      if (user.player.toString() !== game.getActivePlayer()._id.toString())
        throw new Error('Игрок не может совершить это действие, так как сейчас не его ход');

      const event = domain.game[eventName];
      const result = await event(game, eventData);
      const { clearChanges, clientCustomUpdates } = result;
      if (clearChanges) game.clearChanges();

      const changes = game.getChanges();
      if (Object.keys(changes).length) {
        const $set = { ...game };
        delete $set._id;
        await db.mongo.updateOne('game', { _id: db.mongo.ObjectID(gameId) }, { $set });

        domain.db.broadcast({
          smart: true,
          room: 'game-' + game._id,
          data: changes,
        });
      }

      if (clientCustomUpdates) context.client.emit('db/smartUpdated', clientCustomUpdates);

      return result;
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
