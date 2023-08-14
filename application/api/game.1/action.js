({
  access: 'public',
  method: async ({
    name: eventName,
    data: eventData = {},
    customContext: { gameId: processGameId, playerId: processPlayerId } = {},
  }) => {
    try {
      const gameId = (context.gameId || processGameId).toString();
      const playerId = context.playerId || processPlayerId;
      // lib.broadcaster.pubClient.publish(`game-${gameId}`, JSON.stringify({ eventName, eventData }));
      const game = lib.repository.getCollection('game').get(gameId);
      const activePlayer = game.getActivePlayer();

      if (playerId.toString() !== activePlayer._id.toString())
        throw new Error('Игрок не может совершить это действие, так как сейчас не его ход.');
      if (activePlayer.eventData.actionsDisabled && eventName !== 'endRound')
        throw new Error('Игрок не может совершать действия в этот ход.');

      const event = domain.game[eventName];
      const result = event(game, eventData);
      const { clientCustomUpdates } = result;

      await game.broadcastData();
      if (clientCustomUpdates) context.client.emit('db/smartUpdated', clientCustomUpdates);
      return result;
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message, hideMessage: err.stack };
    }
  },
});
