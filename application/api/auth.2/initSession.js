({
  access: 'public',
  method: async ({ token, demo, login, password }) => {
    try {
      let session;
      const sessionData = {};
      let user;
      if (!token) {
        token = api.auth.provider.generateToken();
        if (demo) {
          login = 'demo' + Math.random();
          user = await api.auth.provider.registerUser(login, '');
        } else {
          if (!login || !password) throw new Error('Incorrect login or password');
          user = await api.auth.provider.getUser({ login });
          if (!user) throw new Error('Incorrect login or password');
          const { password: hash } = user;
          const valid = await metarhia.metautil.validatePassword(password, hash);
          if (!valid) throw new Error('Incorrect login or password');
        }
        sessionData.userId = user._id.toString();
        await api.auth.provider.createSession(token, sessionData, { ip: context.client.ip, online: true });
        session = { data: sessionData };
      } else {
        session = await api.auth.provider.restoreSession(token);
        if (session?.online) throw new Error('Session dublicates');
        if (!session) {
          login = 'demo' + Math.random();
          user = await api.auth.provider.registerUser(login, '');
          sessionData.userId = user._id.toString();
          await api.auth.provider.createSession(token, sessionData, { ip: context.client.ip, online: true });
          session = { data: sessionData };
        } else {
          api.auth.provider.saveSession(token, null, { online: true });
          user = await api.auth.provider.getUser({ _id: session.data.userId });
        }
        Object.assign(sessionData, session.data);
      }

      context.client.userId = sessionData.userId;
      context.client.startSession(token, sessionData); // данные попадут в context
      context.client.events.close.push(() => {
        api.auth.provider.saveSession(token, null, { online: false });
        lib.broadcaster.unsubscribe({
          context: { client: context.client, userId: sessionData.userId },
          everywere: true,
        });
        lib.broadcaster.pubClient.publish(
          `lobby-main`,
          JSON.stringify({ eventName: 'leaveLobby', eventData: { token, userId: sessionData.userId } })
        );
        console.log(`session disconnected (token=${token}`);
      });

      lib.broadcaster.subscribe({
        context: { client: context.client, userId: sessionData.userId },
        room: 'lobby-main',
      });
      lib.broadcaster.subClient.subscribe(`lobby-main`, (err, count) => {
        if (err) throw err;
      });
      lib.broadcaster.pubClient.publish(
        `lobby-main`,
        JSON.stringify({
          eventName: 'joinLobby',
          eventData: { token, wid: application.worker.id, userId: sessionData.userId },
        })
      );

      return { token, gameId: sessionData.gameId, playerId: sessionData.playerId };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
