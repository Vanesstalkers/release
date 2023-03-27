({
  access: 'public',
  method: async ({ token, reloadPage }) => {
    try {
      if (!token) return { status: 'err', msg: 'Token not found' };
      // const session = await lib.auth.restoreSession({ token });
      if (session && session.online) return { status: 'err', msg: 'Session dublicate' };
      if (!session) {
      }

      // const data = await api.auth.provider.restoreSession(token);
      return { status: 'ok', msg: data ? 'logged' : 'not logged' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});

// ({
//   access: 'public',
//   method: async ({ token }) => {
//     const restored = context.client.restoreSession(token);
//     if (restored)
//       return {
//         status: 'err',
//         msg: 'Session already opened in another window', // !!! не сработает для разных воркеров
//       };
//     const session = await api.auth.provider.restoreSession(token);
//     if (!session) return { status: 'error', msg: 'Session not found' };

//     const sessionId = session._id;
//     context.client.startSession(token, { ...session.data, _id: sessionId });
//     context.client.sessionId = sessionId;
//     context.client.userId = session.data.userId;
//     Object.assign(context, session.data);

//     // domain.db.data.session.set(context.client, { ...session.data });
//     // const user = await db.mongo.findOne('user', session.data.userId);

//     // if (!user) return { status: 'error', msg: 'User not found' };

//     // domain.db.data.user[user._id] = user;
//     // domain.db.forms.lobby.__user[user._id] = {};
//     // domain.db.broadcast({
//     //   room: 'lobby',
//     //   data: { lobby: domain.db.forms.lobby },
//     //   event: ({ client }) => {
//     //     // domain.db.subscribe({
//     //     //   name: 'user-' + user._id,
//     //     //   client,
//     //     //   type: 'lobby',
//     //     // });
//     //     // client.emit('db/updated', { user: { [user._id]: user } });
//     //   },
//     // });

//     context.client.events.close.push(() => {
//       // !!! добавить отписку от рассылок
//       // domain.db.updateSubscriberRooms({ client: context.client });
//       // delete domain.db.data.user[user._id];
//       // delete domain.db.forms.lobby.__user[user._id];
//       // domain.db.broadcast({
//       //   room: 'lobby',
//       //   data: { lobby: domain.db.forms.lobby },
//       //   event: ({ client }) => {
//       //     // domain.db.unsubscribe({ roomName: 'user-' + user._id, client });
//       //   },
//       // });
//     });

//     return {
//       status: 'ok',
//       msg: 'logged',
//       session: sessionId,
//       game: context.gameId,
//       player: context.playerId,
//     };
// //     } catch (err) {
// //       console.log(err);
// //       return { status: 'err', message: err.message };
// //     }
//   },
// });
