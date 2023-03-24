({
  access: 'public',
  method: async ({ token }) => {
    const restored = context.client.restoreSession(token);
    if (restored)
      return {
        status: 'error',
        msg: 'Session already opened in another window',
      };
    const session = await api.auth.provider.restoreSession(token);
    if (!session) return { status: 'error', msg: 'Session not found' };

    const lobbySession = { ...session.data, _id: session._id.toString() };
    context.client.startSession(token, lobbySession);
    context.userId = session.data.userId;
    context.client.userId = session.data.userId;

    domain.db.data.session.set(context.client, { ...session.data });
    const user = await db.mongo.findOne('user', session.data.userId);

    if (!user) return { status: 'error', msg: 'User not found' };

    domain.db.data.user[user._id] = user;
    domain.db.forms.lobby.__user[user._id] = {};
    domain.db.broadcast({
      room: 'lobby',
      data: { lobby: domain.db.forms.lobby },
      event: ({ client }) => {
        domain.db.subscribe({
          name: 'user-' + user._id,
          client,
          type: 'lobby',
        });
        client.emit('db/updated', { user: { [user._id]: user } });
      },
    });

    context.client.events.close.push(() => {
      domain.db.updateSubscriberRooms({ client: context.client });
      delete domain.db.data.user[user._id];
      delete domain.db.forms.lobby.__user[user._id];
      domain.db.broadcast({
        room: 'lobby',
        data: { lobby: domain.db.forms.lobby },
        event: ({ client }) => {
          domain.db.unsubscribe({ roomName: 'user-' + user._id, client });
        },
      });
    });

    return {
      status: 'ok',
      msg: 'logged',
      session: session._id,
      game: user.game,
      player: user.player,
    };
  },
});
