({
  access: 'public',
  method: async ({
    name: eventName,
    data: eventData = {},
    customContext: { gameId: processGameId, playerId: processPlayerId } = {},
  }) => {
    try {
      const gameId = context.gameId || processGameId;
      const playerId = context.playerId || processPlayerId;
      // lib.broadcaster.pubClient.publish(`game-${gameId}`, JSON.stringify({ eventName, eventData }));
      const game = lib.repository.getCollection('game').get(gameId);
      const activePlayer = game.getActivePlayer();

      if (playerId.toString() !== activePlayer._id.toString() && eventName !== 'leaveGame')
        throw new Error('Игрок не может совершить это действие, так как сейчас не его ход');
      if (activePlayer.eventData.actionsDisabled && eventName !== 'endRound' && eventName !== 'leaveGame')
        throw new Error('Игрок не может совершая действие в этот ход');

      const event = domain.game[eventName];
      const result = await event(game, eventData);
      const { clientCustomUpdates } = result;

      const changes = await game.broadcastData();
      lib.broadcaster.pubClient.publish(
        `game-${gameId}`,
        JSON.stringify({ eventName: 'secureBroadcast', eventData: changes })
      );
      if (clientCustomUpdates) context.client.emit('db/smartUpdated', clientCustomUpdates);
      return result;
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
