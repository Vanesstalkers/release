({
  access: 'public',
  method: async ({ token, windowTabId, demo, login, password }) => {
    try {
      console.log('application.worker.id=', application.worker.id);

      const session = new lib.user.sessionClass({ client: context.client });
      if (token) {
        let sessionLoadResult;
        sessionLoadResult = await session.load({ fromDB: { query: { token, windowTabId } } }).catch(async (err) => {
          // любая ошибка, кроме ожидаемых
          if (err !== 'not_found' && err !== 'user_not_found') throw err;
          if (err === 'user_not_found') token = null; // удалили из БД - нужно пересоздавать сессию

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
              // любая ошибка, кроме ожидаемых
              if (err !== 'not_found' && err !== 'user_not_found') throw err;
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
            session.removeChannel(); // если отработала "user_not_found", то сама сессия могла была быть корректно инициализирована (нужно удалить канал, чтобы повторно произошла подписка на юзера)
            await session.create({
              userId: user.id(),
              userLogin: user.login,
              token: user.token,
              windowTabId,
            });
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

      const lobbyList = Array.from(lib.store.lobby.keys());
      return { token: session.token, userId: session.userId, lobbyList };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message, hideMessage: err.stack };
    }
  },
});
