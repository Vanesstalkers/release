({
  access: 'public',
  method: async ({ login, password, demo }) => {
    try {
      let user;
      if (demo) {
        login = 'demo' + Math.random();
        user = await api.auth.provider.registerUser(login, '');
      } else {
        throw new Error('service disabled');
        // user = await api.auth.provider.getUser(login);
        // if (!user) throw new Error('Incorrect login or password');
        // const { password: hash } = user;
        // const valid = await metarhia.metautil.validatePassword(password, hash);
        // if (!valid) throw new Error('Incorrect login or password');
      }
      console.log(`Logged user: ${login}`);
      const token = api.auth.provider.generateToken();
      const data = {
        userId: user._id,
      };
      // await lib.auth.addSession({ token, data });
      const session = await api.auth.provider.createSession(token, data, { ip: context.client.ip });
      data.sessionId = session._id;

      context.client.startSession(token, data);
      context.client.events.close.push(() => {
        // !!! добавить отписку от рассылок
        console.log('session disconnected');
      });

      //     context.client.sessionId = sessionId;
      //     context.client.userId = session.data.userId;

      return { status: 'ok', msg: 'logged', token };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});

/* ({
  access: 'public',
  method: async ({ login, password, demo }) => {
    let user;
    if (demo) {
      login = 'demo' + Math.random();
      user = await api.auth.provider.registerUser(login, '');
      user.login = login;
    } else {
      user = await api.auth.provider.getUser({ login });
      if (!user) return { status: 'error', msg: 'Incorrect login or password' };
      const { password: hash } = user;
      const valid = await metarhia.metautil.validatePassword(password, hash);
      if (!valid)
        return { status: 'error', msg: 'Incorrect login or password' };
    }
    console.log(`Logged user: ${login}`);

    const token = api.auth.provider.generateToken();
    const { ip } = context.client;
    const sessionData = { userId: user._id.toString() };
    const { _id: sessionId } = await api.auth.provider.startSession(
      token,
      sessionData,
      { ip }
    );

    const lobbySession = { ...sessionData, _id: sessionId.toString() };
    context.client.startSession(token, lobbySession);
    context.client.sessionId = sessionData.sessionId;
    context.client.userId = sessionData.userId;
    context.gameId = sessionData.gameId;
    context.playerId = sessionData.playerId;

    // domain.db.data.session.set(context.client, { ...sessionData });

    // domain.db.data.user[user._id] = user;
    // domain.db.forms.lobby.__user[user._id] = {};
    // domain.db.broadcast({
    //   room: 'lobby',
    //   data: { lobby: domain.db.forms.lobby },
    //   event: ({ client }) => {
    //     // domain.db.subscribe({
    //     //   name: 'user-' + user._id,
    //     //   client,
    //     //   type: 'lobby',
    //     // });
    //     // client.emit('db/updated', { user: { [user._id]: user } });
    //   },
    // });

    context.client.events.close.push(() => {
      // !!! добавить отписку от рассылок
      // domain.db.updateSubscriberRooms({ client: context.client });
      // delete domain.db.data.user[user._id];
      // delete domain.db.forms.lobby.__user[user._id];
      // domain.db.broadcast({
      //   room: 'lobby',
      //   data: { lobby: domain.db.forms.lobby },
      //   event: ({ client }) => {
      //     // domain.db.unsubscribe({ roomName: 'user-' + user._id, client });
      //   },
      // });
    });

    return {
      status: 'ok',
      msg: 'logged',
      session: sessionId,
      token,
    };
  },
});
 */
