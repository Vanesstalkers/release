({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      const game = lib.repository.getCollection('game').get(gameId);
      const { _id: playerId } = await game.userJoin({ userId: context.client.userId });
      context.gameId = gameId.toString();
      context.playerId = playerId.toString();

      const changes = await game.broadcastData();
      lib.broadcaster.pubClient.publish(
        `game-${gameId}`,
        JSON.stringify({ eventName: 'secureBroadcast', eventData: changes })
      );
      
      context.client.emit('session/joinGame', { gameId, playerId });
      lib.repository.getCollection('lobby').get('main').updateGame({ _id: game._id, playerList: game.getPlayerList() });
      // lib.broadcaster.pubClient.publish(
      //   `lobby-main`,
      //   JSON.stringify({ eventName: 'updateGame', eventData: { _id: game._id, playerList: game.getPlayerList() } })
      // );

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
