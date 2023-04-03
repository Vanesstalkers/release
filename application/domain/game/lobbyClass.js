(class Lobby extends lib.broadcaster.class(lib.repository.class(class {})) {
  sessions = new Set();
  games = new Map();
  chat = [];
  constructor({ id }) {
    super({ col: 'lobby', id });
    this.id = id;
    // for (const [name, method] of Object.entries(domain.game.methods)) {
    //   if (name === 'parent') continue;
    //   this[name] = method;
    // }
  }
  getData() {
    const gameMap = {},
      userMap = {};
    for (const [id, game] of this.games) gameMap[id] = this.getSingleGame(game);
    for (const id of this.sessions) userMap[id] = this.getSingleUser(lib.repository.user[id]);
    return {
      lobby: { [this.id]: { userMap: this.getUsersMap(), gameMap: this.getGamesMap() } },
      game: gameMap,
      user: userMap,
      chat: this.getChatMap(),
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
    return Object.fromEntries([...this.sessions].map((id) => [id, {}]));
  }
  getSingleUser(user) {
    return { _id: user._id, name: user.name, login: user.login };
  }

  async restoreChat() {
    const msgList = await db.mongo.find('chat');
    for (const msg of msgList) {
      this.chat.push(msg);
    }
  }
  async updateChat({ text, user }) {
    const time = Date.now();
    const insertData = { text, user, time };
    const { _id } = await db.mongo.insertOne('chat', insertData);
    insertData._id = _id;
    this.chat.push(insertData);
    this.broadcast({ chat: { [`${time}-${_id}`]: insertData } });
  }
  async joinLobby({ token, wid, userId }) {
    this.sessions.add(userId);
    const repoUser = lib.repository.user[userId];
    const { helper = null } = repoUser;

    this.broadcast(
      this.getData(),
      // secureData
      helper
        ? {
            [userId]: {
              user: { [userId]: { helper } },
            },
          }
        : {}
    );

    lib.broadcaster.pubClient.publish(
      `worker-${wid}`,
      JSON.stringify({ emitType: 'db/smartUpdated', directUser: userId, data: this.getData() })
    );
  }
  leaveLobby({ token, userId }) {
    this.sessions.delete(userId);
    this.broadcast(this.getData());
  }
  async updateUser({ userId }) {
    this.broadcast({ user: { [userId]: this.getSingleUser(lib.repository.user[userId]) } });
  }
  async createGame({ type, userId }) {
    const gameJSON = domain.game.exampleJSON[type];
    if (!gameJSON) return;
    const gameData = lib.utils.structuredClone(gameJSON);
    const game = await new domain.game.class().fromJSON(gameData, { newGame: true });
    const insertOne = await db.mongo.insertOne('game', game);
    game._id = insertOne._id;
    this.games.set(game._id.toString(), game);

    this.broadcast({
      lobby: { [this.id]: { gameMap: this.getGamesMap() } },
      game: { [game._id]: this.getSingleGame(game) },
    });
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
  async removeGame({ _id }) {
    const gameId = _id.toString();
    this.games.delete(gameId);
    this.broadcast({ lobby: { [this.id]: { gameMap: this.getGamesMap() } } });

    const game = lib.repository.getCollection('game').get(gameId);
    lib.timers.timerDelete(game);
    game.set('status', 'finished');
    const changes = await game.broadcastData();
    lib.broadcaster.pubClient.publish(
      `game-${gameId}`,
      JSON.stringify({ eventName: 'secureBroadcast', eventData: changes })
    );
  }
  async updateGame({ _id, ...data }) {
    const gameId = _id.toString();
    const game = this.games.get(gameId);
    Object.assign(game, data);
    this.broadcast({ game: { [gameId]: data } });
  }
  async restoreGame(gameData) {
    const game = await new domain.game.class({ _id: gameData._id }).fromJSON(gameData);
    this.games.set(game._id.toString(), game);
  }
});
