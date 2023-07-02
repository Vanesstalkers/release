() =>
  class Game extends lib.store.class(lib.game.gameObject, { broadcastEnabled: true }) {
    #logs = {};
    store = {};
    playerMap = {};

    constructor() {
      const storeData = { col: 'game' };
      const gameObjectData = { col: 'game' };
      super(storeData, gameObjectData);
    }

    async create({ type } = {}) {
      const gameJSON = domain.game.exampleJSON[type];
      if (!gameJSON) throw new Error(`Not found initial game data (type='${type}').`);
      const gameData = lib.utils.structuredClone(gameJSON);
      this.fromJSON(gameData, { newGame: true });

      await this.getProtoParent().create.call(this, { ...this });

      const initiatedGame = await db.redis.hget('games', this.id());
      if (!initiatedGame) await this.addGameToCache();

      return this;
    }

    async addGameToCache() {
      await db.redis.hset(
        'games',
        this.id(),
        {
          id: this.id(),
          workerId: application.worker.id,
          port: application.server.port,
        },
        { json: true }
      );
    }

    log(data) {
      if (typeof data === 'string') data = { msg: data };
      if (!data.time) data.time = Date.now();

      if (data.msg.includes('{{player}}')) {
        const userId = data.userId || this.getActivePlayer().userId;
        const logUser = lib.store('user').get(userId);
        const logUserTitle = logUser.name || logUser.login;
        data.msg = data.msg.replace(/{{player}}/g, `"${logUserTitle}"`);
      }

      const id = (Date.now() + Math.random()).toString().replace('.', '_');
      this.#logs[id] = data;
    }

    isSinglePlayer() {
      return this.settings.singlePlayer;
    }

    getPlayerList() {
      const store = this.getStore();
      return Object.keys(this.playerMap).map((_id) => store.player[_id]);
    }
    getPlayerByUserId(id) {
      return this.getPlayerList().find((player) => player.userId === id);
    }
    async userJoin({ userId }) {
      this.log({ msg: `Игрок {{player}} присоединился к игре.`, userId });

      const player = this.getFreePlayerSlot();
      player.set('ready', true);
      player.set('userId', userId);
      // if (!this.getFreePlayerSlot()) this.updateStatus();

      // context.gameId = gameId.toString();
      // context.playerId = playerId.toString();

      // await game.broadcastData();

      // context.client.emit('session/joinGame', { gameId, playerId });
      // lib.store('lobby').get('main').updateGame({ _id: game._id, playerList: game.getPlayerList() });
      // // lib.broadcaster.pubClient.publish(
      // //   `lobby-main`,
      // //   JSON.stringify({ eventName: 'updateGame', eventData: { _id: game._id, playerList: game.getPlayerList() } })
      // // );

      await this.saveState();
    }
    getFreePlayerSlot() {
      return this.getPlayerList().find((player) => !player.ready);
    }
    getActivePlayer() {
      return this.getPlayerList().find((player) => player.active);
    }
    changeActivePlayer({ player } = {}) {
      const activePlayer = this.getActivePlayer();
      if (activePlayer.eventData.extraTurn) {
        activePlayer.delete('eventData', 'extraTurn');
        if (activePlayer.eventData.skipTurn) {
          // актуально только для событий в течение хода игрока, инициированных не им самим
          activePlayer.delete('eventData', 'skipTurn');
        } else {
          this.log({
            msg: `Игрок {{player}} получает дополнительный ход.`,
            userId: activePlayer.userId,
          });
          return activePlayer;
        }
      }

      const playerList = this.getPlayerList();
      let activePlayerIndex = playerList.findIndex((player) => player === activePlayer);
      let newActivePlayer = playerList[(activePlayerIndex + 1) % playerList.length];
      if (player) {
        if (player.eventData.skipTurn) player.delete('eventData', 'skipTurn');
        newActivePlayer = player;
      } else {
        if (this.isSinglePlayer()) {
          newActivePlayer.delete('eventData', 'actionsDisabled');
          if (newActivePlayer.eventData.skipTurn) {
            this.log({
              msg: `Игрок {{player}} пропускает ход.`,
              userId: newActivePlayer.userId,
            });
            newActivePlayer.delete('eventData', 'skipTurn');
            newActivePlayer.assign('eventData', { actionsDisabled: true });
          }
        } else {
          while (newActivePlayer.eventData.skipTurn) {
            this.log({
              msg: `Игрок {{player}} пропускает ход.`,
              userId: newActivePlayer.userId,
            });
            newActivePlayer.delete('eventData', 'skipTurn');
            activePlayerIndex++;
            newActivePlayer = playerList[(activePlayerIndex + 1) % playerList.length];
          }
        }
      }

      activePlayer.set('active', false);
      newActivePlayer.set('active', true);

      return newActivePlayer;
    }
  };
