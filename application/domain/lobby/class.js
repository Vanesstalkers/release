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
  broadcastDataVueStoreRuleHandler(data, { accessConfig }) {
    return {
      ...data,
      ...(data.users
        ? {
            users: Object.fromEntries(
              Object.entries(lib.utils.clone(data.users)).map(([id, user]) => {
                if (user.events) delete user.events;
                if (user.sessions) {
                  user.online = user.sessions.length > 0 ? true : false;
                  delete user.sessions;
                }
                return [id, user];
              })
            ),
          }
        : {}),
    };
  }

  async updateChat({ text, user, event }) {
    const time = Date.now();
    const chatEvent = { text, event, user, time, parent: this.storeId() };
    const { _id } = await db.mongo.insertOne('chat', chatEvent);
    chatEvent._id = _id.toString();
    this.set({ chat: { [_id]: chatEvent } });
    await this.saveChanges();
    return { chatEventId: chatEvent._id };
  }
  async userEnter({ sessionId, userId, name }) {
    if (!this.users[userId]) {
      this.set({ users: { [userId]: { sessions: [], events: {} } } });
      this.subscribe(`user-${userId}`, { rule: 'fields', fields: ['name'] });
    } else {
      const { enter: lastEnterEventId } = this.users[userId].events;
      this.set({ chat: { [lastEnterEventId]: null } });
    }
    const { chatEventId } = await this.updateChat({ user: { id: userId }, event: 'enter' });

    this.set({
      users: {
        [userId]: {
          sessions: [...this.users[userId].sessions, sessionId],
          events: { enter: chatEventId },
        },
      },
    });
    await this.saveChanges();
  }
  async userLeave({ sessionId, userId }) {
    // может не быть user, если отработало несколько user.leaveLobby (из context.client.events.close)
    const user = this.users[userId];
    if (user) {
      const { leave: lastLeaveEventId } = this.users[userId].events;
      this.set({
        users: {
          [userId]: {
            sessions: user.sessions.filter((id) => id !== sessionId),
          },
        },
        chat: { [lastLeaveEventId]: null },
      });

      const deleteUserFromLobby = user.sessions.length === 0;
      if (deleteUserFromLobby) {
        this.unsubscribe(`user-${userId}`);
        const { chatEventId } = await this.updateChat({ user: { id: userId }, event: 'leave' });
        this.set({ users: { [userId]: { events: { leave: chatEventId } } } });
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
