({
  generateToken() {
    const { characters, secret, length } = config.sessions;
    return metarhia.metautil.generateToken(secret, characters, length);
  },

  async saveSession(token, data) {
    //db.redis.set(token, JSON.stringify(data));
    await db.mongo.findOneAndUpdate(
      'session',
      { token },
      { $set: { data } },
      { returnDocument: 'after' }
    );
  },

  async startSession(token, data, fields = {}) {
    //db.redis.set(token, JSON.stringify(record));
    const session = await db.mongo.insertOne('session', {
      token,
      data,
      ...fields,
    });
    return session;
  },

  async restoreSession(token) {
    // const record = await db.redis.get(token);
    // if(record) return JSON.parse(record);
    const session = await db.mongo.findOne('session', { token });
    if (session && session.data) {
      return session;
    }
    return null;
  },

  deleteSession(token) {
    db.mongo.remove('session', { token });
  },

  async registerUser(login, password) {
    return await db.mongo.insertOne('user', { login, password });
  },

  async getUser({ _id, login }) {
    const search = {};
    if (_id) search._id = db.mongo.ObjectID(_id);
    if (login) search.login = login;
    return await db.mongo.findOne('user', search);
  },
});
