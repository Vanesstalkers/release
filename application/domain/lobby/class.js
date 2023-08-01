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
    for (const [key, map] of Object.entries(data)) {
      switch (key) {
        case 'user':
          this.set({ users: map });
          break;
        case 'game':
          this.set({ games: map });
          this.checkGameStatuses();
          break;
        default:
          throw new Error(`Unexpected  (key=${key}`);
      }
    }
    await this.saveChanges();
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
    // this.users[userId] может не быть, если отработало несколько user.leaveLobby (из context.client.events.close)
    const user = this.users[userId];
    if (user) {
      this.set({
        users: {
          [userId]: {
            sessions: user.sessions.filter((id) => id !== sessionId),
          },
        },
      });
      if (user.sessions.length === 0) {
        this.unsubscribe(`user-${userId}`);
        this.set({ users: { [userId]: null } });
      }
      await this.saveChanges();
    }
  }
  async addGame(gameData) {
    const gameId = gameData.id;
    this.subscribe(`game-${gameId}`, { rule: 'custom', pathRoot: 'domain', path: 'lobby.rules.gameSub' });
    await this.saveChanges();
  }
  async gameFinished({ gameId }) {
    this.unsubscribe(`game-${gameId}`);
    this.set({ games: { [gameId]: null } });
  }
  async checkGameStatuses() {
    for (const [gameId, game] of Object.entries(this.games)) {
      if (game.status === 'FINISHED') {
        this.unsubscribe(`game-${gameId}`);
        this.set({ games: { [gameId]: null } });
      }
    }
    await this.saveChanges();
  }
});
