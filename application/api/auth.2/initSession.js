({
  access: 'public',
  method: async ({ token, windowTabId, demo, login, password }) => {
    try {
      console.log('application.worker.id=', application.worker.id);

      const session = new lib.user.session({ client: context.client });
      if (token) {
        let sessionLoadResult;
        sessionLoadResult = await session.load({ fromDB: { query: { token, windowTabId } } }).catch(async (err) => {
          if (err !== 'not_found') throw err; // любая ошибка, кроме ожидаемой "not_found"

          sessionLoadResult = await session
            .load({ fromDB: { query: { token } } }, { initStore: false, linkSessionToUser: false })
            .then(async (res) => {
              if (res.reconnect) {
                return { ...res };
              } else {
                await session.create({ userId: session.userId, userLogin: session.userLogin, token, windowTabId });
              }
            })
            .catch((err) => {
              if (err !== 'not_found') throw err; // любая ошибка, кроме ожидаемой "not_found"
              token = null;
            });

          return sessionLoadResult;
        });
        if (sessionLoadResult?.reconnect) {
          sessionLoadResult.reconnect.ports = [config.server.balancer].concat(config.server.ports);
          return { reconnect: sessionLoadResult.reconnect };
        }
      }

      if (login || password !== undefined) {
        await session.login({ login, password, windowTabId });
      } else {
        if (!token) {
          if (demo) {
            const user = await new lib.user.mainClass().create({}, { demo }).catch((err) => {
              if (err === 'not_created') throw new Error('Ошибка создания демо-пользователя');
              else throw err;
            });
            const userId = user.id();
            await session.create({ userId, userLogin: user.login, token: user.token, windowTabId });
          } else throw new Error('Требуется авторизация');
        }
      }

      context.client.events.close.push(() => {
        session.user().unlinkSession(session);
        session.unsubscribe(`user-${session.userId}`);
        console.log(`session disconnected (token=${session.token}, windowTabId=${windowTabId}`);
      });

      context.client.startSession(session.token, {
        sessionId: session.id(),
        userId: session.userId,
      }); // данные попадут в context (в следующих вызовах)

      return { token: session.token, userId: session.userId };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
