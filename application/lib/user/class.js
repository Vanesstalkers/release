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

    if (!(await db.redis.hget('users', login)))
      await db.redis.hset('users', login, { id: this.id(), password, token }, { json: true });

    return this;
  }

  async load(from, config) {
    await this.getProtoParent().load.call(this, from, config);

    if (!(await db.redis.hget('users', this.login)))
      await db.redis.hset(
        'users',
        this.login,
        { id: this.id(), password: this.password, token: this.token },
        { json: true }
      );

    return this;
  }
});
