({
  access: 'public',
  method: async ({ token, windowTabId, demo, login, password }) => {
    try {
      console.log('application.worker.id=', application.worker.id);

      const session = new lib.user.session({ client: context.client });
      if (token) {
        await session.load({ fromDB: { query: { token, windowTabId } } });
        if (session.loadError()) {
          await session.load({ fromDB: { query: { token } } }, { initStoreDisabled: true });
          if (session.loadError()) token = null;
          else await session.create({ userId: session.userId, userLogin: session.userLogin, token, windowTabId });
        }
      }

      if (login || password !== undefined) {
        await session.login({ login, password, windowTabId });
      } else {
        if (!token) {
          if (demo) {
            const user = await new lib.user.class().create({}, { demo });
            if (user.loadError()) throw new Error('Ошибка создания демо-пользователя');
            const userId = user.id();
            await session.create({ userId, userLogin: user.login, token: user.token, windowTabId });
          } else throw new Error('Требуется авторизация');
          // else return { status: 'ok', need_login: true };
        }
      }

      const sessionData = {};
      sessionData.sessionId = session.id();
      sessionData.userId = session.userId;
      context.client.startSession(session.token, {
        sessionId: session.id(),
        userId: session.userId,
      }); // данные попадут в context (в следующих вызовах)
      context.client.events.close.push(() => {
        console.log(`session disconnected (token=${session.token}`);
      });

      return { token: session.token, userId: session.userId };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
