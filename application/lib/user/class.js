(class User extends lib.store.class(class {}, { broadcastEnabled: true }) {
  constructor({ id, client }) {
    super({ col: 'user', id, client, selfBroadcastData: true });
  }
  async create({ login, password }, { demo = false } = {}) {
    if (demo) {
      if (!login) login = 'demo' + Math.random();
      if (!password) password = '';
    }
    password = await metarhia.metautil.hashPassword(password);
    return await Object.getPrototypeOf(Object.getPrototypeOf(this)).create.call(this, { login, password });
  }
  async login({ login, password }) {
    if (!login || password === undefined) throw new Error('Неправильный логин или пароль.');
    await this.load({ fromDB: { query: { login } } });
    if (this.loadError()) throw new Error('Неправильный логин или пароль.');
    const valid = await metarhia.metautil.validatePassword(password, this.password);
    if (!valid) throw new Error('Неправильный логин или пароль.');
  }
  processData(data) {
    try {
      this.getClient().emit('db/smartUpdated', data);
    } catch (err) {
      // !!! заменить на проверку, что ws-подключение еще живо
    }
  }
});
