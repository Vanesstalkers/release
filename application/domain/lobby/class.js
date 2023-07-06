(class Lobby extends lib.store.class(class {}, { broadcastEnabled: true }) {
  users = {};
  games = {};
  chat = {};
  rankings = {};
  constructor({ id } = {}) {
    super({ col: 'lobby', id });

    // for (const [name, method] of Object.entries(domain.game.methods)) {
    //   if (name === 'parent') continue;
    //   this[name] = method;
    // }
  }
  async load() {
    const msgList = await db.mongo.find('chat', { parent: this.storeId() }, { limit: 3, sort: [['_id', -1]] });
    for (const msg of msgList) this.chat[msg._id] = msg;

    // this.rankings = {
    //   topPlayers: {
    //     title: 'topPlayers',
    //     active: true,
    //     list: [
    //       { games: 100, win: 55 },
    //       { games: 20, win: 19 },
    //     ],
    //   },
    //   topFreelancers: {
    //     title: 'topFreelancers',
    //     list: [],
    //   },
    //   richestPlayers: {
    //     title: 'richestPlayers',
    //     list: [],
    //   },
    // };

    // this.fixState();
    console.log(`Lobby "${this.storeId()}" loaded.`);
    return this;
  }

  /**
   * Сохраняет данные при получении обновлений
   * @param {*} data
   */
  async processData(data) {
    const store = this.store;
    Object.entries(data).forEach(([key, map]) => {
      switch (key) {
        case 'user':
          this.set({ users: map });
          break;
        case 'game':
          this.set({ games: map });
          break;
        default:
          if (!store[key]) this.set({ store: { [key]: {} } });
          this.set({ store: { [key]: map } });
      }
    });
    await this.saveChanges();
  }
  getGamesMap() {
    return Object.fromEntries(Object.entries(Object.fromEntries(this.games)).map(([id]) => [id, {}]));
  }

  async updateChat({ text, user }) {
    const time = Date.now();
    const insertData = { text, user, time, parent: this.storeId() };
    const { _id } = await db.mongo.insertOne('chat', insertData);
    insertData._id = _id;
    this.set({ chat: { [_id]: insertData } });
    await this.saveChanges();
  }
  async userEnter({ sessionId, userId, name }) {
    if (!this.users[userId]) {
      this.set({ users: { [userId]: { sessions: [] } } });
      this.subscribe(`user-${userId}`, { rule: 'fields', fields: ['name'] });
    }
    this.set({ users: { [userId]: { sessions: [...this.users[userId].sessions, sessionId] } } });
    await this.saveChanges();
  }
  async userLeave({ sessionId, userId }) {
    this.set({ users: { [userId]: { sessions: this.users[userId].sessions.filter((id) => id !== sessionId) } } });
    if (this.users[userId].sessions.length === 0) {
      this.set({ users: { [userId]: null } });
      this.unsubscribe(`user-${userId}`);
    }
    await this.saveChanges();
  }
  async addGame(gameData) {
    const gameId = gameData.id;
    this.subscribe(`game-${gameId}`, { rule: 'custom', pathRoot: 'domain', path: 'lobby.rules.gameSub' });
    await this.saveChanges();
  }
  async removeGame({ _id, canceledByUser }) {
    const gameId = _id.toString();
    this.games.delete(gameId);
    this.broadcast({ lobby: { [this.id]: { gameMap: this.getGamesMap() } } });

    const game = lib.repository.getCollection('game').get(gameId);
    lib.timers.timerDelete(game);
    game.set({ status: 'finished' });
    await game.broadcastData();

    const afterGameHelpers = {};
    const playerList = game.getObjects({ className: 'Player' });
    for (const player of playerList) {
      const { userId } = player;
      const repoUser = lib.store('user').get(userId);
      const type = canceledByUser
        ? userId === canceledByUser
          ? 'lose'
          : 'cancel'
        : userId === game.winUserId
        ? 'win'
        : 'lose';
      const helper = domain.game['tutorialGameEnd'][type];
      afterGameHelpers[userId] = { user: { [userId]: { helper } } };
      repoUser.currentTutorial = { active: 'tutorialGameEnd' };
      repoUser.helper = helper;
    }
    this.broadcast(null, afterGameHelpers);
  }
  updateGame({ _id, ...data }) {
    // const gameId = _id.toString();
    // const game = this.games.get(gameId);
    // if (game) {
    //   Object.assign(game, data);
    //   this.broadcast({ game: { [gameId]: data } });
    // }
  }
});
