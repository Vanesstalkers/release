(class Lobby extends lib.store.class(class {}, { broadcastEnabled: true }) {
  users = {};
  games = {};
  rankings = {};

  constructor({ id } = {}) {
    super({ col: 'lobby', id });
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
    });
    this.preventSaveFields(['chat', 'users.sessions', 'users.events']);

    // for (const [name, method] of Object.entries(domain.game.methods)) {
    //   if (name === 'parent') continue;
    //   this[name] = method;
    // }
  }
  async create({ code }) {
    const users = {
      1: {
        rankings: {
          release: { games: 100, money: 100000, win: 55, crutch: 1, penalty: 1000, totalTime: 3000, avrTime: 30 },
          car: { games: 100, money: 100000, win: 55 },
          bank: { games: 100, money: 100000, win: 55 },
        },
      },
      2: {
        rankings: {
          release: { games: 20, money: 50000, win: 19, crutch: 10, penalty: 10000, totalTime: 1000, avrTime: 29 },
          car: { games: 99, money: 10000, win: 45 },
          bank: { games: 99, money: 10000, win: 45 },
        },
      },
      3: {
        rankings: {
          release: { games: 50, money: 15000, win: 22, crutch: 2, penalty: 3000, totalTime: 5000, avrTime: 35 },
          car: { games: 98, money: 1000, win: 35 },
          bank: { games: 98, money: 1000, win: 35 },
        },
      },
      4: {
        rankings: {
          release: { games: 1, money: 500, win: 0, crutch: 0, penalty: 0, totalTime: 0, avrTime: 0 },
          car: { games: 97, money: 100, win: 25 },
          bank: { games: 97, money: 100, win: 25 },
        },
      },
    };

    const rankings = {
      release: {
        title: 'Релиз',
        rankingMap: {
          richestPlayers: {
            title: 'Самые богатые',
            active: true,
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'money', title: 'Заработано денег' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
          topPlayers: {
            title: 'Трудоголики',
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'win', title: 'Закончено проектов' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
          topFreelancers: { title: 'Фрилансеры', headers: [], usersTop: ['1', '2', '3', '4'] },
          bestQuality: {
            title: 'Лучшее качество',
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'crutch', title: 'Костылей' },
              { code: 'penalty', title: 'Штрафов' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
          bestT2M: {
            title: 'Лучший time2market',
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'totalTime', title: 'Потрачено времени' },
              { code: 'avrTime', title: 'В среднем' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
        },
      },
      car: {
        title: 'Автопродажи',
        rankingMap: {
          richestPlayers: {
            title: 'Самые богатые',
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'money', title: 'Заработано денег' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
          topPlayers: {
            title: 'Трудоголики',
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'win', title: 'Закончено проектов' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
        },
      },
      bank: {
        title: 'Банк-продаж',
        rankingMap: {
          richestPlayers: {
            title: 'Самые богатые',
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'money', title: 'Заработано денег' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
          topPlayers: {
            title: 'Трудоголики',
            headers: [
              { code: 'games', title: 'Написано проектов' },
              { code: 'win', title: 'Закончено проектов' },
            ],
            usersTop: ['1', '2', '3', '4'],
          },
        },
      },
    };

    await this.getProtoParent().create.call(this, { code, users, rankings });

    return this;
  }
  async load(from, config) {
    await this.getProtoParent().load.call(this, from, config);

    await this.restoreChat();

    this.games = {}; // обнуляем (восстановление игр после рестарта сервера еще не работает)
    for (const user of Object.values(this.users)) {
      user.sessions = [];
    }
    await this.saveChanges();

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
          // без removeEmptyObject у user будет обнуляться (в БД) объект rankings (потому что в map изменения придут, но они будут идентичны значению в masterObj)
          this.set({ users: map }, { removeEmptyObject: true });
          for (const [userId, value] of Object.entries(map)) {
            if (value.rankings) this.checkRatings({ initiatorUserId: userId });
          }
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
  async userEnter({ sessionId, userId, name }) {
    if (!this.users[userId]) {
      this.set({ users: { [userId]: { sessions: [], events: {} } } });
    } else {
      const { enter: lastEnterEventId } = this.users[userId].events;
      this.set({ chat: { [lastEnterEventId]: null } });
    }
    if (this.users[userId].sessions.length === 0) {
      // ловит как новых юзеров, так и тех, кто пришел после deleteUserFromLobby (в userLeave)
      this.subscribe(`user-${userId}`, { rule: 'fields', fields: ['name', 'rankings'] });
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
    const { id: gameId, type, subtype } = gameData;
    this.subscribe(`game-${gameId}`, { rule: 'custom', pathRoot: 'domain', path: 'lobby.rules.gameSub' });
    await this.saveChanges();
  }
  async gameFinished({ gameId, gameType }) {
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

  rankingSortFunc = {
    'release.richestPlayers': (a, b) => ((a.money || -1) > (b.money || -1) ? -1 : 1),
    'release.topPlayers': (a, b) => ((a.games || -1) > (b.games || -1) ? -1 : 1),
    'release.topFreelancers': null,
    'release.bestQuality': (a, b) => ((a.crutch || -1) / (a.games || -1) < (b.crutch || -1) / (b.games || -1) ? -1 : 1),
    'release.bestT2M': (a, b) => ((a.avrTime || -1) < (b.avrTime || -1) ? -1 : 1),
    'car.richestPlayers': (a, b) => ((a.money || -1) > (b.money || -1) ? -1 : 1),
    'car.topPlayers': (a, b) => ((a.games || -1) > (b.games || -1) ? -1 : 1),
    'bank.richestPlayers': (a, b) => ((a.money || -1) > (b.money || -1) ? -1 : 1),
    'bank.topPlayers': (a, b) => ((a.games || -1) > (b.games || -1) ? -1 : 1),
  };

  async checkRatings({ initiatorUserId, gameType = 'release' }) {
    const game = this.rankings[gameType];
    const rankingList = Object.entries(game.rankingMap).map(([code, ranking]) => ({ ...ranking, code }));
    for (const ranking of rankingList) {
      const users = Object.values(ranking.usersTop); // клонирование массива usersTop
      if (!users.includes(initiatorUserId)) users.push(initiatorUserId);
      const usersTop = users.map((userId) => ({ ...(this.users[userId].rankings?.[gameType] || {}), userId }));

      const sortFunc = this.rankingSortFunc[`${gameType}.${ranking.code}`];
      if (sortFunc) {
        usersTop.sort(sortFunc);
        this.set({
          rankings: {
            [gameType]: { rankingMap: { [ranking.code]: { usersTop: usersTop.map(({ userId }) => userId) } } },
          },
        });
      }
    }
    await this.saveChanges();
  }
});
