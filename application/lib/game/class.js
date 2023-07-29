() =>
  class Game extends lib.store.class(lib.game.gameObject, { broadcastEnabled: true }) {
    #logs = {};
    store = {};
    playerMap = {};
    #broadcastObject = {};

    constructor() {
      const storeData = { col: 'game' };
      const gameObjectData = { col: 'game' };
      super(storeData, gameObjectData);
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
          } else if (col === 'game' || col === 'player' || changes.fake) {
            result[col][id] = changes;
          } else {
            const obj = this.getObjectById(id);
            // объект может быть удален (!!! костыль)
            if (obj && typeof obj.prepareBroadcastData === 'function') {
              const { visibleId, preparedData } = obj.prepareBroadcastData({ data: changes, player });
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
      delete this._id; // удаляем _id от gameObject, чтобы он не попал в БД

      await this.getProtoParent().create.call(this, { ...this });

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
    async playerJoin({ userId, userName }) {
      const player = this.getFreePlayerSlot();
      if (!player) throw new Error('Свободных мест не осталось');

      player.set({ ready: true, userId, userName });
      this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });

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
          : userId === this.winUserId
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

        // т.к. в catch сохранения нет, то внутри event не должно быть throw, которые отменят какие либо изменения
        const event = domain.game[eventName];
        const result = event(this, eventData);
        const { clientCustomUpdates } = result;

        await this.saveChanges();

        if (clientCustomUpdates) {
          lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
            type: 'db/smartUpdated',
            data: clientCustomUpdates,
          });
        }
      } catch (err) {
        lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', { data: { msg: err.message } });
      }
    }

    broadcastData(data, { customChannel } = {}) {
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

      const subscribers = this.channel().subscribers.entries();
      for (const [subscriberChannel, { accessConfig = {} } = {}] of subscribers) {
        if (!customChannel || subscriberChannel === customChannel) {
          let publishData;
          const { rule = 'all', fields = [], pathRoot, path, userId } = accessConfig;
          switch (rule) {
            /**
             * фильтруем данные через кастомный обработчик
             */
            case 'custom':
              if (!pathRoot || !path)
                throw new Error(
                  `Custom rule handler path or pathRoot (subscriberChannel="${subscriberChannel}") not found`
                );
              const splittedPath = path.split('.');
              const method = lib.utils.getDeep(pathRoot === 'domain' ? domain : lib, splittedPath);
              if (typeof method !== 'function')
                throw new Error(
                  `Custom rule handler (subscriberChannel="${subscriberChannel}", path="${path}") not found`
                );
              publishData = this.wrapPublishData(method(data));
              break;
            /**
             * отправляем только выбранные поля (и вложенные в них объекты)
             */
            case 'fields':
              publishData = this.wrapPublishData(
                Object.fromEntries(
                  Object.entries(data).filter(([key, value]) =>
                    fields.find((field) => key === field || key.indexOf(field + '.') === 0)
                  )
                )
              );
              break;
            /**
             * отправляем данные в формате хранилища на клиенте
             */
            case 'vue-store':
              publishData = this.wrapPublishData({
                ...data,
                ...(data.store ? { store: this.prepareBroadcastData({ userId, data: data.store }) } : {}),
              });
              break;
            case 'all':
            default:
              publishData = this.wrapPublishData(data);
          }
          if (!Object.keys(publishData).length) continue;
          lib.store.broadcaster.publishData(subscriberChannel, publishData);
        }
      }

      if (broadcastObject) this.#broadcastObject = {};
    }
  };
