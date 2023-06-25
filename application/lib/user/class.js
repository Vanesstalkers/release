(class User extends lib.store.class(class {}, { broadcastEnabled: true }) {
  constructor({ id } = {}) {
    super({ col: 'user', id });
  }
  async create({ login, password, token }, { demo = false } = {}) {
    if (demo) {
      if (!login) login = 'demo' + Math.random();
      if (!password) password = '';
    }
    password = await metarhia.metautil.hashPassword(password);
    if (!token) token = api.auth.provider.generateToken();

    await this.getProtoParent().create.call(this, { login, password, token });

    const initiatedUser = await db.redis.hget('users', this.login);
    if (!initiatedUser) await this.addUserToCache();

    return this;
  }

  async load(from, config) {
    await this.getProtoParent().load.call(this, from, config);
    const initiatedUser = await db.redis.hget('users', this.login);
    if (!initiatedUser) await this.addUserToCache();
    return this;
  }

  async addUserToCache() {
    await db.redis.hset(
      'users',
      this.login,
      {
        id: this.id(),
        password: this.password,
        token: this.token,
        workerId: application.worker.id,
        port: application.server.port,
      },
      { json: true }
    );
  }
});
