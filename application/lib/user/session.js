(class Session extends lib.store.class(class {}, { broadcastEnabled: true }) {
  #user;
  constructor({ id, client } = {}) {
    super({ col: 'session', id, client });
  }
  user(user) {
    if (user !== undefined) return (this.#user = user);
    return this.#user;
  }

  async create({ userId, userLogin, token, windowTabId }) {
    if (!userId) throw new Error('Ошибка создания сессии (empty userId).');

    const user = lib.store('user').get(userId);
    user.linkSession(this);

    return await this.getProtoParent().create.call(this, { token, windowTabId, userId, userLogin });
  }
  async load(from, config) {
    await this.getProtoParent().load.call(this, from, config);

    let user;
    const userOnline = await db.redis.hget('users', this.userLogin, { json: true });
    if (!userOnline) {
      user = await new lib.user.mainClass().load({ fromDB: { id: this.userId } }).catch((err) => {
        if (err === 'not_found') throw new Error('Session user not found');
        else throw err;
      });
      // вызов в initChannel при создании сессии не отработал, так как канала `user-${this.userId}` еще не было
      this.subscribe(`user-${this.userId}`);
    } else {
      if (userOnline.workerId !== application.worker.id) {
        return { reconnect: { workerId: userOnline.workerId, port: userOnline.port } };
      }
      user = lib.store('user').get(userOnline.id);
    }

    user.linkSession(this);

    return this;
  }
  async login({ login, password, windowTabId }) {
    if (!login || password === undefined) throw new Error('Неправильный логин или пароль.');
    let userOnline = await db.redis.hget('users', login, { json: true });
    if (!userOnline) {
      const user = await new lib.user.mainClass()
        .load({
          fromDB: { query: { login } },
        })
        .catch((err) => {
          if (err === 'not_found') throw new Error('Неправильный логин или пароль.');
          else throw err;
        });
      const valid = await metarhia.metautil.validatePassword(password, user.password);
      if (!valid) throw new Error('Неправильный логин или пароль.');
      userOnline = { id: user.id(), token: user.token };
    } else {
      const valid = await metarhia.metautil.validatePassword(password, userOnline.password);
      if (!valid) throw new Error('Неправильный логин или пароль.');
    }
    if (!this.id())
      await this.create({ userId: userOnline.id, userLogin: login, token: userOnline.token, windowTabId });
  }
  initChannel(data) {
    this.getProtoParent().initChannel.call(this, data);
    this.subscribe(`user-${this.userId}`);
  }
  /**
   * Базовая функция класса для сохранения данных при получении обновлений
   * @param {*} data
   */
  processData(data) {
    try {
      this.client().emit('db/smartUpdated', data);
    } catch (err) {
      // !!! заменить на проверку, что ws-подключение еще живо
    }
  }
});
