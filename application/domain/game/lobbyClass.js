(class Lobby extends lib.broadcaster.class(lib.repository.class(class {})) {
  sessions = new Set();
  games = new Map();
  constructor({ id }) {
    super({ col: 'lobby', id });
    this.id = id;

    for (const [name, method] of Object.entries(domain.game.methods)) {
      if (name === 'parent') continue;
      this[name] = method;
    }
  }
  getData() {
    const gameMap = {};
    for (const [id, game] of this.games) gameMap[id] = this.getSingleGame(game);
    return {
      lobby: { [this.id]: { userList: [...this.sessions], gameMap: this.getGamesMap() } },
      game: gameMap,
    };
  }
  getGamesMap() {
    return Object.fromEntries(Object.entries(Object.fromEntries(this.games)).map(([id]) => [id, {}]));
  }
  getSingleGame(game) {
    return { _id: game._id, round: game.round, status: game.status, playerList: game.getPlayerList() };
  }

  joinLobby({ token, wid, userId }) {
    this.sessions.add(userId);
    this.broadcast({ lobby: { [this.id]: { userList: [...this.sessions] } } });
    lib.broadcaster.pubClient.publish(
      `worker-${wid}`,
      JSON.stringify({ emitType: 'db/smartUpdated', directUser: userId, data: this.getData() })
    );
  }
  leaveLobby({ token, userId }) {
    this.sessions.delete(userId);
    this.broadcast({ lobby: { [this.id]: { userList: [...this.sessions] } } });
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
  async restoreGame(gameData) {
    const game = await new domain.game.class({ _id: gameData._id }).fromJSON(gameData);
    this.games.set(game._id.toString(), game);
  }
});
