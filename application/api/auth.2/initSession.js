({
  access: 'public',
  method: async ({ token, demo, login, password }) => {
    try {
      let session;
      const sessionData = {};
      const user = new lib.user.class({ client: context.client });
      if (!token) {
        token = api.auth.provider.generateToken();
        if (demo) {
          await user.create({}, { demo: true });
        } else {
          await user.login({ login, password });
        }
        sessionData.userId = user.getId();
        await api.auth.provider.createSession(token, sessionData, { ip: context.client.ip, online: true });
        session = { data: sessionData };
      } else {
        session = await api.auth.provider.restoreSession(token);
        if (session?.online) throw new Error('Дубликат сессии. Выйдите с сайта в других окнах браузера.');
        if (session) {
          await user.load({ fromDB: { id: session.data.userId } });
          if (user.loadError()) session = null;
          else api.auth.provider.saveSession(token, null, { online: true });
        }
        if (!session) {
          await user.create({}, { demo: true });
          sessionData.userId = user.getId();
          await api.auth.provider.createSession(token, sessionData, { ip: context.client.ip, online: true });
          session = { data: sessionData };
        }
        Object.assign(sessionData, session.data);
      }

      context.client.userId = sessionData.userId;
      context.client.startSession(token, sessionData); // данные попадут в context (в следующих вызовах)
      context.client.events.close.push(() => {
        console.log(`session disconnected (token=${token}`);
        api.auth.provider.saveSession(token, null, { online: false });
      });

      return { token, userId: sessionData.userId };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
