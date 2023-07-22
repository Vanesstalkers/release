(class LobbyUser extends lib.user.class() {
  async enterLobby({ sessionId }) {
    lib.store.broadcaster.publishAction(`lobby-main`, 'userEnter', {
      sessionId,
      userId: this.id(),
      name: this.name,
    });

    let { helper = null, helperLinks = {}, finishedTutorials = {} } = this;
    const lobbyStartTutorialName = 'lobby-tutorial-start';
    if (!helper && !finishedTutorials[lobbyStartTutorialName]) {
      const tutorial = lib.helper.getTutorial(lobbyStartTutorialName);
      helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
      // helperLinks = {
      //   'menu-top': { selector: '.menu-item.top', tutorial: lobbyStartTutorialName, type: 'lobby' },
      //   'menu-chat': { selector: '.menu-item.chat', tutorial: 'lobby-tutorial-menu', type: 'lobby' },
      // };
      this.set({ currentTutorial: { active: lobbyStartTutorialName } });
      this.set({ helper });
      this.set({ helperLinks });
    }

    // if (gameId) {
    //   const gameLoaded = await db.redis.hget('games', gameId);
    //   let game;
    //   if (gameLoaded) {
    //     game = lib.repository.getCollection('game').get(gameId);
    //   } else {
    //     const gameData = await db.mongo.findOne('game', gameId);
    //     if (gameData) {
    //       game = new domain.game.class({ _id: gameId }).fromJSON(gameData);
    //       if (game.status !== 'finished') {
    //         lib.timers.timerRestart(game, { extraTime: 0 }); // перезапустит таймер с временем активного игрока (фича)
    //         lib.repository.getCollection('game').set(gameId, game);
    //         const lobby = lib.store('lobby').get('main');
    //         lobby.addGame({ _id: gameId, round: game.round, status: game.status, playerList: game.getPlayerList() });
    //         // lib.broadcaster.pubClient.publish(
    //         //   `lobby-main`,
    //         //   JSON.stringify({
    //         //     eventName: 'addGame',
    //         //     eventData: { _id: gameId, round: game.round, status: game.status, playerList: game.getPlayerList() },
    //         //   })
    //         // );
    //       }
    //     }
    //   }
    //   if (game && game.status !== 'finished') {
    //     context.client.emit('session/joinGame', { gameId, playerId });
    //   } else {
    //     context.gameId = null;
    //     context.playerId = null;
    //   }
    // }

    await this.saveChanges();
  }
  leaveLobby({ sessionId }) {
    const lobbyName = `lobby-main`;
    lib.store.broadcaster.publishAction(lobbyName, 'userLeave', {
      sessionId,
      userId: this.id(),
    });
  }

  async joinGame({ gameId, playerId }) {
    this.set({ gameId, playerId });
    await this.saveChanges();

    for (const session of this.sessions()) {
      session.set({ gameId, playerId });
      await session.saveChanges();
      session.send('session/joinGame', { gameId, playerId });
    }

    // !!! тут нужно обновить все сессии и переключить их на игру
    // + нужно заменить broadcast на собственные сессии прямым вызовом session.processData

    // context.gameId = gameId.toString();
    // context.playerId = playerId.toString();
    // const session = lib.store('session').get(sessionId);
    //   session.gameId = gameId;
    //   await session.saveChanges();

    // const userId = context.client.userId;
    // const game = lib.repository.getCollection('game').get(gameId);
    // if (!game) throw new Error('Игра не найдена.');
    // if (game.finished) throw new Error('Игра уже завершена.');

    // const repoUser = lib.store('user').get(userId);
    // let { helper = null, helperLinks = {}, finishedTutorials = {} } = repoUser;

    // const startTutorial = Object.keys(game.playerMap).length > 1 ? 'tutorialGameStart' : 'tutorialGameSingleStart';
    // if (!helper && !finishedTutorials[startTutorial]) {
    //   helper = Object.values(domain.game[startTutorial]).find(({ initialStep }) => initialStep);
    //   repoUser.helper = helper;
    //   repoUser.currentTutorial = { active: startTutorial };
    //   lib.timers.timerRestart(game, { time: 60 });
    // }
    // if (Object.keys(helperLinks).length === 0) {
    //   helperLinks = {
    //     planeControls: {
    //       selector: '.gameplane-controls',
    //       tutorial: 'tutorialGameLinks',
    //       type: 'game',
    //       pos: { top: false, left: false },
    //     },
    //     handPlanes: {
    //       selector: '.hand-planes',
    //       tutorial: 'tutorialGameLinks',
    //       type: 'game',
    //       pos: { top: true, left: true },
    //     },
    //     cardActive: {
    //       selector: '[code="Deck[card_active]"] .card-event',
    //       tutorial: 'tutorialGameLinks',
    //       type: 'game',
    //       pos: { top: false, left: true },
    //     },
    //     leaveGame: {
    //       selector: '.leave-game-btn',
    //       tutorial: 'tutorialGameLinks',
    //       type: 'game',
    //       pos: { top: true, left: true },
    //     }
    //   };
    //   repoUser.helperLinks = helperLinks;
    // }

    // let data;
    // try {
    //   data = game.prepareBroadcastData({
    //     userId,
    //     data: { ...game.store, game: { [gameId]: { ...game, store: undefined } }, logs: game.logs },
    //   });
    // } catch (err) {
    //   // !!! нужно выяснить, в каких случаях возникают проблемы с первичным наполнением игры
    //   game.updateStatus();
    //   throw err;
    // }

    // data.user = { [userId]: { helper, helperLinks } };
    // context.client.emit('db/smartUpdated', data);

    // lib.broadcaster.subscribe({ room: `game-${gameId}`, client: context.client });
  }
  async leaveGame() {
    const { gameId } = this;
    this.set({ gameId: null, playerId: null });
    await this.saveChanges();

    for (const session of this.sessions()) {
      session.unsubscribe(`game-${gameId}`);
      session.set({ gameId: null, playerId: null });
      await session.saveChanges();
      session.send('session/leaveGame', {});
    }
  }
});
