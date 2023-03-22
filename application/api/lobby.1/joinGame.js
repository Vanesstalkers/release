({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      const game = domain.db.data.game[gameId];
      const player = await game.userJoin({ userId: context.userId });
      const playerId = player._id;

      const session = domain.db.data.session.get(context.client);
      const user = domain.db.data.user[session.userId];
      user.game = gameId;
      user.player = playerId;
      context.game = gameId;
      context.player = playerId;

      await game.broadcastData();

      await db.mongo.updateOne('user', user._id, { $set: user });
      domain.db.broadcast({ room: 'user-' + user._id, data: { user: { [user._id]: user } } });
      context.client.emit('session/joinGame', { gameId, playerId });

      return 'ok';
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
