({
  access: 'public',
  method: async () => {
    try {
      const {
        token,
        client: { userId },
        gameId,
        playerId,
      } = context;
      lib.broadcaster.subscribe({ room: 'lobby-main', client: context.client });
      lib.broadcaster.subClient.subscribe(`lobby-main`, (err, count) => {
        if (err) throw err;
      });
      lib.repository.getCollection('lobby').get('main').joinLobby({ token, wid: application.worker.id, userId });
      // lib.broadcaster.pubClient.publish(
      //   `lobby-main`,
      //   JSON.stringify({ eventName: 'joinLobby', eventData: { token, wid: application.worker.id, userId } })
      // );

      context.client.events.close.push(() => {
        
      });

      if (gameId) {
        const gameLoaded = await db.redis.hget('games', gameId);
        let game;
        if (gameLoaded) {
          game = lib.repository.getCollection('game').get(gameId);
        } else {
          const gameData = await db.mongo.findOne('game', gameId);
          if (gameData) {
            game = new domain.game.class({ _id: gameId }).fromJSON(gameData);
            if (game.status !== 'finished') {
              lib.timers.timerRestart(game, { extraTime: 0 }); // перезапустит таймер с временем активного игрока (фича)
              lib.repository.getCollection('game').set(gameId, game);
              lib.repository
                .getCollection('lobby')
                .get('main')
                .addGame({ _id: gameId, round: game.round, status: game.status, playerList: game.getPlayerList() });
              // lib.broadcaster.pubClient.publish(
              //   `lobby-main`,
              //   JSON.stringify({
              //     eventName: 'addGame',
              //     eventData: { _id: gameId, round: game.round, status: game.status, playerList: game.getPlayerList() },
              //   })
              // );
            }
          }
        }
        if (game && game.status !== 'finished') {
          context.client.emit('session/joinGame', { gameId, playerId });
        } else {
          context.gameId = null;
          context.playerId = null;
        }
      }

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
