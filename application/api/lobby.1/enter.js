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

      const user = lib.store('user').get(userId);
      user.subscribe(`lobby-main`);
      lib.store.broadcaster.publishAction(`lobby-main`, 'joinLobby', { id: user.getId(), name: user.name });

      let { helper = null, helperLinks = {}, finishedTutorials = {} } = user;
      if (!helper && !finishedTutorials['tutorialLobbyStart']) {
        helper = Object.values(domain.game['tutorialLobbyStart']).find(({ initialStep }) => initialStep);
        // helperLinks = {
        //   'menu-top': { selector: '.menu-item.top', tutorial: 'tutorialLobbyStart', type: 'lobby' },
        //   'menu-chat': { selector: '.menu-item.chat', tutorial: 'tutorialMenu', type: 'lobby' },
        // };
        user.currentTutorial = { active: 'tutorialLobbyStart' };
        user.helper = helper;
        user.helperLinks = helperLinks;
      }

      context.client.events.close.push(() => {
        lib.store.broadcaster.publishAction(`lobby-main`, 'leaveLobby', { id: user.getId() });
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
              const lobby = lib.store('lobby').get('main');
              lobby.addGame({ _id: gameId, round: game.round, status: game.status, playerList: game.getPlayerList() });
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

      await user.saveState();
      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
