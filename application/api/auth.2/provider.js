({
  generateToken() {
    const { characters, secret, length } = config.sessions;
    return metarhia.metautil.generateToken(secret, characters, length);
  },

  async saveSession(token, data, fields = {}) {

    // !!! надо прицепить к lib.user.session

    // if (fields.online !== undefined) {
    //   await db.redis.hset('online', token, fields.online ? 1 : 0);
    //   delete fields.online;
    // }
    // const $set = { ...fields };
    // if (data) $set.data = data;
    // await db.mongo.findOneAndUpdate('session', { token }, { $set }, { returnDocument: 'after' });
  },

  async createSession(token, data, fields = {}) {
    if (!data.userId) throw new Error('Пользователь не найден.');
    if (fields.online !== undefined) {
      await db.redis.hset('online', token, fields.online ? 1 : 0);
      delete fields.online;
    }
    await db.mongo.insertOne('session', { token, data, ...fields });
  },

  async restoreSession(token) {
    const session = await db.mongo.findOne('session', { token });
    if (session && session.data) {
      session.online = parseInt(await db.redis.hget('online', token)) > 0;
      return session;
    }
    return null;
  },

  async deleteSession(token) {
    await db.mongo.deleteOne('session', { token });
    await db.redis.hdel('online', token);
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
