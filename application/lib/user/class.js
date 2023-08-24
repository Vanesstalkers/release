() =>
  class User extends lib.store.class(class {}, { broadcastEnabled: true }) {
    #sessions = new Map();
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

      await super.create({ login, password, token });

      const initiatedUser = await db.redis.hget('users', this.id());
      if (!initiatedUser) await this.addUserToCache();

      return this;
    }

    async load(from, config) {
      await super.load(from, config);
      const initiatedUser = await db.redis.hget('users', this.id());
      if (!initiatedUser) await this.addUserToCache();
      return this;
    }

    async addUserToCache() {
      await db.redis.hset(
        'users',
        this.id(),
        {
          id: this.id(),
          login: this.login,
          password: this.password,
          token: this.token,
          workerId: application.worker.id,
          port: application.server.port,
        },
        { json: true }
      );
    }

    /**
     * Сохраняет данные при получении обновлений
     * @param {*} data
     */
    async processData(data) {
      this.set(data);
      await this.saveChanges();
    }

    linkSession(session) {
      this.#sessions.set(session.id(), session);
      session.user(this);
      session.linkTime = Date.now(); // время последнего create или load
    }
    async unlinkSession(session) {
      this.#sessions.delete(session.id());
      if (this.#sessions.size === 0) await db.redis.hdel('users', this.id());
      session.user(null);
    }
    sessions() {
      return this.#sessions.values();
    }
    broadcastToSessions({ data, type = 'session/msg' } = {}) {
      for (const session of this.sessions()) {
        session.send(type, data);
      }
    }
  };
