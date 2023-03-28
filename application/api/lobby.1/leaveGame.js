({
  access: 'public',
  method: async () => {
    try {
      const gameId = context.gameId;
      const game = lib.repository.getCollection('game').get(gameId);
      // !!! завернуть сюда все окончания игры
      lib.timers.timerDelete(game);
      game.set('status', 'finished');
      context.gameId = null;
      context.playerId = null;

      const changes = await game.broadcastData();

      lib.broadcaster.pubClient.publish(
        `game-${gameId}`,
        JSON.stringify({ eventName: 'secureBroadcast', eventData: changes })
      );
      lib.repository.getCollection('lobby').get('main').removeGame({ _id: gameId });

      return 'ok';
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
