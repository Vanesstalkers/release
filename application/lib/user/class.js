(class User extends lib.store.class(class {}, { broadcastEnabled: true }) {
  constructor({ id } = {}) {
    super({ col: 'user', id });
  }
  async create({ login, password, token }, { demo = false } = {}) {
    if (demo) {
      if (!login) login = 'demo' + Math.random();
      if (!password) password = '';
    }
    password = await metarhia.metautil.hashPassword(password);
    if (!token) token = api.auth.provider.generateToken();

    await this.getProtoParent().create.call(this, { login, password, token });

    if (!(await db.redis.hget('users', login)))
      await db.redis.hset('users', login, { id: this.id(), password, token }, { json: true });

    return this;
  }

  async load(from, config) {
    await this.getProtoParent().load.call(this, from, config);
    if (this.loadError()) return this;

    if (!(await db.redis.hget('users', this.login)))
      await db.redis.hset(
        'users',
        this.login,
        { id: this.id, password: this.password, token: this.token },
        { json: true }
      );

    return this;
  }

  async joinLobby({ sessionId }) {
    const { gameId, playerId } = this;

    lib.store.broadcaster.publishAction(`lobby-main`, 'joinLobby', {
      sessionId,
      userId: this.id(),
      name: this.name,
    });

    let { helper = null, helperLinks = {}, finishedTutorials = {} } = this;
    if (!helper && !finishedTutorials['tutorialLobbyStart']) {
      helper = Object.values(domain.game['tutorialLobbyStart']).find(({ initialStep }) => initialStep);
      // helperLinks = {
      //   'menu-top': { selector: '.menu-item.top', tutorial: 'tutorialLobbyStart', type: 'lobby' },
      //   'menu-chat': { selector: '.menu-item.chat', tutorial: 'tutorialMenu', type: 'lobby' },
      // };
      this.currentTutorial = { active: 'tutorialLobbyStart' };
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
