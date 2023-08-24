(class Lobby extends lib.store.class(class {}, { broadcastEnabled: true }) {
  users = {};
  games = {};
  rankings = {};
  rankingsUsersTop = [];

  constructor({ id } = {}) {
    super({ col: 'lobby', id });
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
    });
    this.preventSaveFields(['chat']);

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

    await super.create({ code, users, rankings });

    this.checkRatings();
    await this.saveChanges();

    return this;
  }
  async load(from, config) {
    await super.load(from, config);

    await this.restoreChat();

    this.games = {}; // обнуляем (восстановление игр после рестарта сервера еще не работает)
    for (const user of Object.values(this.users)) {
      user.sessions = [];
      user.events = {};
      if (user.online) delete user.online;
    }
    this.checkRatings();
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
    // const { userId } = accessConfig;
    return {
      ...data,
      ...(data.users
        ? {
            users: Object.fromEntries(
              Object.entries(lib.utils.clone(data.users))
                .filter(
                  ([id, user]) =>
                    user.online === null || // юзер только что вышел из лобби
                    // ниже проверки для рассылок по событию addSubscriber
                    this.users[id].online || // не делаем рассылку тех, кто оффлайн
                    this.rankingsUsersTop.includes(id) // оставляем в рассылке тех, что входит в топ рейтингов (чтобы отобразить их в таблицах рейтингов)
                )
                .map(([id, user]) => {
                  // if (id === userId) user.iam = true;
                  if (user.online) user = { ...this.users[id] }; // установка online произошла позже, чем отработал addSubscriber (без этого пользователь появится на фронте, но без данных)

                  // если бы не строчка выше, то делал бы это в prepareInitialDataForSubscribers()
                  if (user.events) delete user.events;
                  if (user.sessions) delete user.sessions;
                  return [id, user];
                })
            ),
          }
        : {}),
    };
  }
  async userEnter({ sessionId, userId, name }) {
    let user = this.users[userId];
    if (!user) {
      this.set({ users: { [userId]: {} } });
      user = this.users[userId];
      user.sessions = [];
      user.events = {};
    } else {
      const { enter: lastEnterEventId } = user.events;
      this.set({ chat: { [lastEnterEventId]: null } });

      if (user.personalChatMap) {
        lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
          type: 'db/smartUpdated',
          data: { user: { [userId]: { personalChatMap: user.personalChatMap } } },
        });
        this.set({ users: { [userId]: { personalChatMap: null } } });
      }
    }
    if (user.sessions.length === 0) {
      // ловит как новых юзеров, так и тех, кто пришел после deleteUserFromLobby (в userLeave)
      this.subscribe(`user-${userId}`, { rule: 'fields', fields: ['name', 'rankings'] });
    }

    const { chatEventId } = await this.updateChat(
      { user: { id: userId }, event: 'enter' },
      { preventSaveChanges: true }
    );

    const sessions = [...user.sessions, sessionId];
    user.sessions = sessions;
    user.events.enter = chatEventId;
    this.set({ users: { [userId]: { online: true } } });
    await this.saveChanges();
  }
  async userLeave({ sessionId, userId }) {
    const user = this.users[userId];
    if (user) {
      // может не быть user, если отработало несколько user.leaveLobby (из session.onClose)

      const { leave: lastLeaveEventId } = user.events;
      const sessions = user.sessions.filter((id) => id !== sessionId);
      user.sessions = sessions;
      this.set({ chat: { [lastLeaveEventId]: null } });

      if (sessions.length === 0) {
        // вышел из лобби

        this.unsubscribe(`user-${userId}`);
        const { chatEventId } = await this.updateChat(
          { user: { id: userId }, event: 'leave' },
          { preventSaveChanges: true }
        );
        user.events.leave = chatEventId;
        this.set({ users: { [userId]: { online: null } } }); // удаляем именно через null, чтобы отловить событие в broadcastDataVueStoreRuleHandler
      }
      await this.saveChanges();
    }
  }

  // !!! нужно решить, как организовать связку chat+lobby (в частности, решить где должна быть эта функция)
  async delayedChatEvent({ userId, targetId, chatEvent }) {
    let user = this.users[targetId];
    if (!user) {
      this.set({ users: { [targetId]: {} } });
      user = this.users[targetId];
      user.sessions = [];
      user.events = {};
    }
    this.set({
      users: {
        [targetId]: {
          personalChatMap: { [userId]: { items: { [chatEvent._id]: chatEvent } } },
        },
      },
    });
    await this.saveChanges();
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

  checkRatings({ initiatorUserId = null, gameType = 'release' } = {}) {
    const game = this.rankings[gameType];
    const rankingList = Object.entries(game.rankingMap).map(([code, ranking]) => ({ ...ranking, code }));
    const rankingsUsersTop = [];
    for (const ranking of rankingList) {
      const users = Object.values(ranking.usersTop); // клонирование массива usersTop
      if (initiatorUserId && !users.includes(initiatorUserId)) users.push(initiatorUserId);
      const draftUsersTop = users.map((userId) => ({ ...(this.users[userId].rankings?.[gameType] || {}), userId }));

      const sortFunc = this.rankingSortFunc[`${gameType}.${ranking.code}`];
      const usersTop = !sortFunc
        ? []
        : draftUsersTop
            .sort(sortFunc)
            .map(({ userId }) => userId)
            .splice(0, 3);

      this.set({
        rankings: {
          [gameType]: { rankingMap: { [ranking.code]: { usersTop } } },
        },
      });

      rankingsUsersTop.push(...usersTop);
    }
    this.set({
      rankingsUsersTop: rankingsUsersTop.filter((val, idx, arr) => arr.indexOf(val) === idx),
    });
  }
});
