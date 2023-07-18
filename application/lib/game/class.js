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

    prepareFakeData({ data, userId }) {
      const result = {};
      const player = this.getPlayerByUserId(userId);

      for (const [col, ids] of Object.entries(data)) {
        result[col] = {};
        for (const [id, changes] of Object.entries(ids)) {
          if (col === 'game' || col === 'player' || changes.fake) {
            result[col][id] = changes;
          } else {
            const obj = this.getObjectById(id);
            // объект может быть удален (!!! костыль)
            if (obj && typeof obj.prepareFakeData === 'function') {
              const { visibleId, preparedData } = obj.prepareFakeData({ data: changes, player });
              result[col][visibleId] = preparedData;
            } else result[col][id] = changes;
          }
        }
      }
      return result;
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

    logs(data) {
      if (!data) return this.#logs;

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
    async playerJoin({ userId }) {
      const player = this.getFreePlayerSlot();
      if (!player) throw new Error('Свободных мест не осталось');

      this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });
      player.set({ ready: true, userId });
      if (!this.getFreePlayerSlot()) this.updateStatus();
      await this.saveChanges();

      lib.store.broadcaster.publishAction(`user-${userId}`, 'joinGame', { gameId: this.id(), playerId: player.id() });
    }
    async playerLeave({ userId }) {
      if (this.status !== 'finished') {
        this.logs({ msg: `Игрок {{player}} вышел из игры.`, userId });
        await this.endGame({ canceledByUser: userId });
      }
      lib.store.broadcaster.publishAction(`user-${userId}`, 'leaveGame', {});
    }
    async endGame({ canceledByUser } = {}) {
      lib.timers.timerDelete(this);
      this.set({ status: 'finished' });

      const playerList = this.getObjects({ className: 'Player' });
      const playerEndGameStatus = {};
      for (const player of playerList) {
        const { userId } = player;
        const endGameStatus = canceledByUser
          ? userId === canceledByUser
            ? 'lose'
            : 'cancel'
          : userId === game.winUserId
          ? 'win'
          : 'lose';
        player.set({ endGameStatus });
        playerEndGameStatus[userId] = endGameStatus;
      }
      await this.saveChanges();

      this.broadcastAction('gameFinished', { gameId: this.id(), playerEndGameStatus });
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
        activePlayer.set({ eventData: { extraTurn: null } });
        if (activePlayer.eventData.skipTurn) {
          // актуально только для событий в течение хода игрока, инициированных не им самим
          activePlayer.set({ eventData: { skipTurn: null } });
        } else {
          this.logs({
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
        if (player.eventData.skipTurn) player.set({ eventData: { skipTurn: null } });
        newActivePlayer = player;
      } else {
        if (this.isSinglePlayer()) {
          newActivePlayer.set({ eventData: { actionsDisabled: null } });
          if (newActivePlayer.eventData.skipTurn) {
            this.logs({
              msg: `Игрок {{player}} пропускает ход.`,
              userId: newActivePlayer.userId,
            });
            newActivePlayer.set({
              eventData: {
                skipTurn: null,
                actionsDisabled: true,
              },
            });
          }
        } else {
          while (newActivePlayer.eventData.skipTurn) {
            this.logs({
              msg: `Игрок {{player}} пропускает ход.`,
              userId: newActivePlayer.userId,
            });
            newActivePlayer.set({ eventData: { skipTurn: null } });
            activePlayerIndex++;
            newActivePlayer = playerList[(activePlayerIndex + 1) % playerList.length];
          }
        }
      }

      activePlayer.set({ active: false });
      newActivePlayer.set({ active: true });

      return newActivePlayer;
    }

    async handleAction({ name: eventName, data: eventData = {}, sessionUserId: userId }) {
      try {
        const player = this.getPlayerList().find((player) => player.userId === userId);
        if (!player) throw new Error('player not found');

        const activePlayer = this.getActivePlayer();
        if (player._id !== activePlayer._id && eventName !== 'leaveGame')
          throw new Error('Игрок не может совершить это действие, так как сейчас не его ход.');
        else if (activePlayer.eventData.actionsDisabled && eventName !== 'endRound' && eventName !== 'leaveGame')
          throw new Error('Игрок не может совершать действия в этот ход.');

        const event = domain.game[eventName];
        const result = event(this, eventData);
        const { clientCustomUpdates } = result;

        await this.saveChanges();

        if (clientCustomUpdates) {
          lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
            type: 'smartUpdated',
            data: clientCustomUpdates,
          });
        }
      } catch (err) {
        console.log(err);
        lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', { data: { error: err.message } });
      }
    }
  };
