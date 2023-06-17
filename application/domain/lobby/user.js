(class LobbyUser extends lib.user.class {
  async joinLobby({ sessionId }) {
    const { gameId, playerId } = this;

    lib.store.broadcaster.publishAction(`lobby-main`, 'joinLobby', {
      sessionId,
      userId: this.id(),
      name: this.name,
    });

    let { helper = null, helperLinks = {}, finishedTutorials = {} } = this;
    const lobbyStartTutorialName = 'lobby.tutorial.start';
    if (!helper && !finishedTutorials[lobbyStartTutorialName]) {
      const tutorial = lib.helper.getTutorial(lobbyStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      // helperLinks = {
      //   'menu-top': { selector: '.menu-item.top', tutorial: lobbyStartTutorialName, type: 'lobby' },
      //   'menu-chat': { selector: '.menu-item.chat', tutorial: 'lobby.tutorial.menu', type: 'lobby' },
      // };
      this.currentTutorial = { active: lobbyStartTutorialName };
      this.helper = helper;
      this.helperLinks = helperLinks;
    }

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

    await this.saveState();
  }
  leaveLobby({ sessionId }) {
    lib.store.broadcaster.publishAction(`lobby-main`, 'leaveLobby', { sessionId, userId: this.id() });
  }
});
