(class Lobby extends lib.store.class(class {}, { broadcastEnabled: true }) {
  store = {
    user: {},
    games: {},
  };
  users = {};
  chat = [];
  rankings = {};
  constructor({ id }) {
    super({ col: 'lobby', id });

    // for (const [name, method] of Object.entries(domain.game.methods)) {
    //   if (name === 'parent') continue;
    //   this[name] = method;
    // }
  }
  async load() {
    // const msgList = await db.mongo.find('chat');
    // for (const msg of msgList) this.chat.push(msg);

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
    this.fixState();
    return this;
  }

  async processData(data) {
    function assignIdMap(target, sourceMap) {
      Object.keys(sourceMap).forEach((id) => {
        Object.entries(sourceMap[id]).forEach(([k, v]) => {
          const props = k.split('.');
          if (!target[id]) target[id] = {};
          let itemPart = target[id];
          for (let i = 0; i < props.length - 1; i++) {
            if (!itemPart[props[i]]) itemPart[props[i]] = {};
            itemPart = itemPart[props[i]];
          }
          itemPart[props[props.length - 1]] = v;
        });
      });
    }

    const store = this.store;
    Object.entries(data).forEach(([key, map]) => {
      switch (key) {
        case 'user':
          assignIdMap(this.users, map);
          break;
        default:
          if (!store[key]) store[key] = {};
          assignIdMap(store[key], map);
      }
    });

    await this.saveState();
  }
  // broadcastData(data, config) {
  //   Object.getPrototypeOf(Object.getPrototypeOf(this)).broadcastData.call(this, data, config);
  // }
  getData() {
    console.log('getData this.users=', this.users);
    const gameMap = {},
      userMap = {};
    for (const [id, game] of this.games) gameMap[id] = this.getSingleGame(game);
    // for (const id of this.users) userMap[id] = {}; /* this.getSingleUser(lib.repository.user[id]) */
    return {
      lobby: {
        [this.id]: { userMap: this.getUsersMap(), gameMap: this.getGamesMap() },
      },
      game: gameMap,
      user: this.users,
      chat: this.getChatMap(),
      ranking: this.rankings,
    };
  }
  getChatMap() {
    return Object.fromEntries(this.chat.slice(-10).map((msg) => [`${msg.time}-${msg._id}`, msg]));
  }
  getGamesMap() {
    return Object.fromEntries(Object.entries(Object.fromEntries(this.games)).map(([id]) => [id, {}]));
  }
  getSingleGame(game) {
    return { _id: game._id, round: game.round, status: game.status, playerList: game.playerList };
  }
  getUsersMap() {
    return Object.fromEntries([...this.users].map((id) => [id, {}]));
  }
  getSingleUser(user) {
    return { _id: user._id, name: user.name, login: user.login };
  }

  async updateChat({ text, user }) {
    const time = Date.now();
    const insertData = { text, user, time };
    const { _id } = await db.mongo.insertOne('chat', insertData);
    insertData._id = _id;
    this.chat.push(insertData);
    this.broadcast({ chat: { [`${time}-${_id}`]: insertData } });
  }
  async joinLobby({ id, name }) {
    this.users[id] = { name };
    this.subscribe(`user-${id}`, { rule: 'fields', fields: ['name', 'test.name'] });
    await this.saveState();
  }
  async leaveLobby({ id }) {
    this.users[id] = null;
    await this.saveState();
  }
  async addGame(gameData) {
    const gameId = gameData._id.toString();
    await db.redis.hset('games', gameId, true);
    this.games.set(gameId, gameData);
    this.broadcast({
      lobby: { [this.id]: { gameMap: this.getGamesMap() } },
      game: { [gameId]: gameData },
    });
  }
  async removeGame({ _id, canceledByUser }) {
    const gameId = _id.toString();
    this.games.delete(gameId);
    this.broadcast({ lobby: { [this.id]: { gameMap: this.getGamesMap() } } });

    const game = lib.repository.getCollection('game').get(gameId);
    lib.timers.timerDelete(game);
    game.set('status', 'finished');
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
    const gameId = _id.toString();
    const game = this.games.get(gameId);
    if (game) {
      Object.assign(game, data);
      this.broadcast({ game: { [gameId]: data } });
    }
  }
});
