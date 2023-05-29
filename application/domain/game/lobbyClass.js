(class Lobby extends lib.broadcaster.class(lib.repository.class(class {})) {
  sessions = new Set();
  games = new Map();
  chat = [];
  topPlayers = {
    1: { games: 100, win: 55 },
    2: { games: 20, win: 19 },
  };
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
      topPlayers: this.getTopPlayersMap(),
    };
  }
  getTopPlayersMap() {
    return this.topPlayers;
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
  joinLobby({ token, wid, userId }) {
    this.sessions.add(userId);
    const repoUser = lib.repository.user[userId];
    let { helper = null, helperLinks = {}, finishedTutorials = {} } = repoUser;
    if (!helper && !finishedTutorials['tutorialLobbyStart']) {
      helper = Object.values(domain.game['tutorialLobbyStart']).find(({ initialStep }) => initialStep);
      // helperLinks = {
      //   'menu-top': { selector: '.menu-item.top', tutorial: 'tutorialLobbyStart', type: 'lobby' },
      //   'menu-chat': { selector: '.menu-item.chat', tutorial: 'tutorialMenu', type: 'lobby' },
      // };
      repoUser.currentTutorial = { active: 'tutorialLobbyStart' };
      repoUser.helper = helper;
      repoUser.helperLinks = helperLinks;
    }

    this.broadcast(
      this.getData(),
      // secureData
      {
        [userId]: {
          user: { [userId]: { helper, helperLinks } },
        },
      }
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
  updateUser({ userId }) {
    this.broadcast({ user: { [userId]: this.getSingleUser(lib.repository.user[userId]) } });
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
      const repoUser = lib.repository.user[userId];
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
