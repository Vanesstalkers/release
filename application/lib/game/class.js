() =>
  class Game extends lib.store.class(lib.game.gameObject, { broadcastEnabled: true }) {
    #logs = {};
    store = {};
    playerMap = {};
    #broadcastObject = {};
    #broadcastDataAfterHandlers = {};

    constructor() {
      const storeData = { col: 'game' };
      const gameObjectData = { col: 'game' };
      super(storeData, gameObjectData);
    }

    async create({ type, subtype } = {}) {
      const gameJSON = domain.game.exampleJSON[subtype];
      if (!gameJSON) throw new Error(`Not found initial game data (type='${type}', subtype='${subtype}').`);
      const gameData = lib.utils.structuredClone(gameJSON);
      gameData.addTime = Date.now();
      gameData.type = type;
      gameData.subtype = subtype;
      this.fromJSON(gameData, { newGame: true });
      delete this._id; // удаляем _id от gameObject, чтобы он не попал в БД

      await super.create({ ...this });

      const initiatedGame = await db.redis.hget('games', this.id());
      if (!initiatedGame) await this.addGameToCache();

      return this;
    }
    async load({ fromData = null, fromDB = {} }, { initStore = true } = {}) {
      if (fromData) {
        Object.assign(this, fromData);
      } else {
        let { id, query } = fromDB;
        if (!query && id) query = { _id: db.mongo.ObjectID(id) };
        if (query) {
          const dbData = await db.mongo.findOne(this.col(), query);
          if (dbData === null) {
            throw 'not_found';
          } else {
            this.fromJSON(dbData);
            if (!this.id() && initStore) {
              this.initStore(dbData._id);
              if (!this.channel()) this.initChannel();
            }
          }
        }
      }
      if (this._id) delete this._id; // не должно мешаться при сохранении в mongoDB
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

    markNew(obj, { saveToDB = false } = {}) {
      if (saveToDB) {
        this.setChanges({ store: { [obj._col]: { [obj._id]: obj } } });
      } else {
        if (!this.#broadcastObject[obj._col]) this.#broadcastObject[obj._col] = {};
        this.#broadcastObject[obj._col][obj._id] = true;
      }
    }
    markDelete(obj, { saveToDB = false } = {}) {
      if (saveToDB) {
        this.setChanges({ store: { [obj._col]: { [obj._id]: null } } });
      } else {
        if (!this.#broadcastObject[obj._col]) this.#broadcastObject[obj._col] = {};
        this.#broadcastObject[obj._col][obj._id] = null;
      }
    }

    logs(data) {
      if (!data) return this.#logs;

      if (typeof data === 'string') data = { msg: data };
      if (!data.time) data.time = Date.now();

      if (data.msg.includes('{{player}}')) {
        const player = data.userId
          ? this.getObjects({ className: 'Player' }).find(({ userId }) => userId === data.userId)
          : this.getActivePlayer();
        data.msg = data.msg.replace(/{{player}}/g, `"${player.userName}"`);
      }

      const id = (Date.now() + Math.random()).toString().replace('.', '_');
      this.#logs[id] = data;
    }
    async showLogs({ userId, sessionId, lastItemTime }) {
      let logs = this.logs();
      if (lastItemTime) {
        logs = Object.fromEntries(Object.entries(logs).filter(([{}, { time }]) => time > lastItemTime));
      }
      this.broadcastData({ logs }, { customChannel: `session-${sessionId}` });
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
    async playerJoin({ userId, userName, userAvatarCode }) {
      try {
        if (this.status === 'FINISHED') throw new Error('Игра уже завершена.');

        const player = this.getFreePlayerSlot();
        if (!player) throw new Error('Свободных мест не осталось');

        player.set({
          ready: true,
          userId,
          userName,
          avatarCode: userAvatarCode || Math.ceil(Math.random() * 12),
        });
        this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });

        this.checkStatus({ cause: 'PLAYER_JOIN' });
        await this.saveChanges();

        lib.store.broadcaster.publishAction(`user-${userId}`, 'joinGame', {
          gameId: this.id(),
          playerId: player.id(),
          gameType: this.type,
          isSinglePlayer: this.isSinglePlayer(),
        });
      } catch (exception) {
        lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
          data: { message: exception.message, stack: exception.stack },
        });
      }
    }
    async playerLeave({ userId }) {
      if (this.status !== 'FINISHED') {
        this.logs({ msg: `Игрок {{player}} вышел из игры.`, userId });
        try {
          this.endGame({ canceledByUser: userId });
        } catch (exception) {
          if (exception instanceof lib.game.endGameException) {
            await this.removeGame();
          } else throw exception;
        }
      }
      lib.store.broadcaster.publishAction(`user-${userId}`, 'leaveGame', {});
    }
    endGame({ winningPlayer, canceledByUser } = {}) {
      lib.timers.timerDelete(this);
      this.emitCardEvents('endRound'); // костыли должны восстановить свои значения

      if (this.status !== 'IN_PROCESS') canceledByUser = true; // можно отменить игру, еще она еще не начата (ставим true, чтобы ниже попасть в условие cancel-ветку)
      this.set({ status: 'FINISHED' });
      if (winningPlayer) this.setWinner({ player: winningPlayer });

      const playerList = this.getObjects({ className: 'Player' });
      const playerEndGameStatus = {};
      for (const player of playerList) {
        const { userId } = player;
        const endGameStatus = canceledByUser
          ? userId === canceledByUser
            ? 'lose'
            : 'cancel'
          : this.winUserId
          ? userId === this.winUserId
            ? 'win'
            : 'lose'
          : 'lose'; // игра закончилась автоматически
        player.set({ endGameStatus });
        playerEndGameStatus[userId] = endGameStatus;
      }

      this.checkCrutches();
      this.broadcastAction('gameFinished', {
        gameId: this.id(),
        gameType: this.type,
        playerEndGameStatus,
        crutchCount: this.crutchCount(),
      });

      throw new lib.game.endGameException();
    }
    setWinner({ player }) {
      this.set({ winUserId: player.userId });
      this.logs({ msg: `Игрок {{player}} победил в игре.`, userId: player.userId });
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

        const result = this.run(eventName, eventData);
        const { clientCustomUpdates } = result || {};

        await this.saveChanges();

        if (clientCustomUpdates) {
          lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
            type: 'db/smartUpdated',
            data: clientCustomUpdates,
          });
        }
      } catch (exception) {
        if (exception instanceof lib.game.endGameException) {
          await this.removeGame();
        } else {
          lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
            data: { message: exception.message, stack: exception.stack },
          });
        }
      }
    }

    prepareBroadcastData({ data = {}, userId }) {
      const result = {};
      const player = this.getPlayerByUserId(userId);

      for (const [col, ids] of Object.entries(data)) {
        result[col] = {};
        for (const [id, changes] of Object.entries(ids)) {
          if (changes === null) {
            // тут удаление через markDelete
            result[col][id] = null;
          } else if (col === 'game' || changes.fake) {
            result[col][id] = changes;
          } else {
            const obj = this.getObjectById(id);
            if (obj && typeof obj.prepareBroadcastData === 'function') {
              const { visibleId, preparedData } = obj.prepareBroadcastData({ data: changes, player });
              result[col][visibleId] = preparedData;
              if (typeof obj.broadcastDataAfterHandler === 'function') {
                this.#broadcastDataAfterHandlers[id] = obj.broadcastDataAfterHandler.bind(obj);
              }
            } else result[col][id] = changes;
          }
        }
      }
      return result;
    }

    /**
     * Дополнительные обработчики для store.broadcastData
     */
    broadcastDataBeforeHandler(data, config = {}) {
      const { customChannel } = config;

      const broadcastObject = !customChannel && this.#broadcastObject;
      if (broadcastObject) {
        for (const col of Object.keys(this.#broadcastObject)) {
          for (const _id of Object.keys(this.#broadcastObject[col])) {
            const objectData =
              this.#broadcastObject[col][_id] === null ? null : lib.utils.structuredClone(this.store[col][_id]);
            lib.utils.mergeDeep({
              target: data,
              source: { store: { [col]: { [_id]: objectData } } },
            });
          }
        }
      }
    }
    broadcastDataAfterHandler(data, config = {}) {
      const { customChannel } = config;

      for (const handler of Object.values(this.#broadcastDataAfterHandlers)) {
        if (typeof handler === 'function') handler();
      }
      this.#broadcastDataAfterHandlers = {};

      const broadcastObject = !customChannel && this.#broadcastObject;
      if (broadcastObject) this.#broadcastObject = {};
    }
    broadcastDataVueStoreRuleHandler(data, { accessConfig }) {
      const { userId } = accessConfig;
      return {
        ...data,
        ...(data.store ? { store: this.prepareBroadcastData({ userId, data: data.store }) } : {}),
      };
    }
    async removeGame() {
      await db.redis.hdel('games', this.id());
      await this.saveChanges();
      this.broadcastData({ logs: this.logs() });
      this.remove();
    }
  };
