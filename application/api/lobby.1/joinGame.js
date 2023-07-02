({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      const { userId } = context.client;
      const game = lib.repository.getCollection('game').get(gameId);

      game.log({ msg: `Игрок {{player}} присоединился к игре.`, userId });

      const { _id: playerId } = game.userJoin({ userId });
      context.gameId = gameId.toString();
      context.playerId = playerId.toString();

      await game.broadcastData();

      context.client.emit('session/joinGame', { gameId, playerId });
      lib.store('lobby').get('main').updateGame({ _id: game._id, playerList: game.getPlayerList() });
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
