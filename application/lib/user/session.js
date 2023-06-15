(class Session extends lib.store.class(class {}, { broadcastEnabled: true }) {
  constructor({ id, client } = {}) {
    super({ col: 'session', id, client });
  }
  async create({ userId, userLogin, token, windowTabId }) {
    if (!userId) throw new Error('Ошибка создания сессии (empty userId).');
    return await this.getProtoParent().create.call(this, { token, windowTabId, userId, userLogin });
  }
  async load(from, config) {
    await this.getProtoParent().load.call(this, from, config);
    if (this.loadError()) return this;

    const userOnline = await db.redis.hget('users', this.userLogin, { json: true });
    if (!userOnline) {
      const user = await new lib.user.class().load({ fromDB: { id: this.userId } });
      if (user.loadError()) return this;
      // вызов в initChannel при создании сессии не отработал, так как канала `user-${this.userId}` еще не было
      this.subscribe(`user-${this.userId}`);
    }

    return this;
  }
  async login({ login, password, windowTabId }) {
    if (!login || password === undefined) throw new Error('Неправильный логин или пароль.');
    const userOnline = await db.redis.hget('users', login, { json: true });
    if (!userOnline) {
      const user = await new lib.user.class().load({
        fromDB: { query: { login } },
      });
      if (user.loadError()) throw new Error('Неправильный логин или пароль.');
      const valid = await metarhia.metautil.validatePassword(password, user.password);
      if (!valid) throw new Error('Неправильный логин или пароль.');
      userOnline.id = user.id;
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
  processData(data) {
    try {
      this.client().emit('db/smartUpdated', data);
    } catch (err) {
      // !!! заменить на проверку, что ws-подключение еще живо
    }
  }
});
