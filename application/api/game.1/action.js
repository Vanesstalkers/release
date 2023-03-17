({
  access: 'public',
  method: async ({ name: eventName, data: eventData = {} }) => {
    try {
      const gameId = context.game;
      const user = await db.mongo.findOne('user', context.userId);
      const game = domain.db.data.game[gameId];
      const activePlayer = game.getActivePlayer();
      game.clearChanges();

      if (user.player.toString() !== activePlayer._id.toString())
        throw new Error('Игрок не может совершить это действие, так как сейчас не его ход');
      if (activePlayer.eventData.actionsDisabled && eventName !== 'endRound' && eventName !== 'leaveGame')
        throw new Error('Игрок не может совершая действие в этот ход');

      const event = domain.game[eventName];
      const result = await event(game, eventData);
      const { clientCustomUpdates } = result;

      await game.broadcastData();
      if (clientCustomUpdates) context.client.emit('db/smartUpdated', clientCustomUpdates);
      return result;
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
